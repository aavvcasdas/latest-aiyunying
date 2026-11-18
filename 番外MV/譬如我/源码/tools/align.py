"""Offline Mandarin CTC alignment of the supplied film audio, not a live API.

Usage: python tools/align.py MODEL_DIR AUDIO_16KHZ_MONO_F32
Requires numpy, scipy, onnxruntime, pypinyin. The model is parseh/aligner-zh.
"""
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from pypinyin import lazy_pinyin
from scipy.special import logsumexp


root = Path(__file__).resolve().parents[1]
model, audio = Path(sys.argv[1]), Path(sys.argv[2])
source = json.loads((root / 'src/data/lyrics-source.json').read_text())
lines = [s for section in source['order'] for s in source[section]]
text = ''.join(lines).replace('|', '')
vocab = json.loads((model / 'vocab.json').read_text())
blank = vocab.get('<pad>', 0)
ids = []
for char in text:
    if char in vocab:
        ids.append(vocab[char])
    else:
        reading = lazy_pinyin(char)
        replacement = next((c for c in vocab if len(c) == 1 and lazy_pinyin(c) == reading), None)
        ids.append(vocab.get(replacement, vocab.get('<unk>', 3)))
        print('Phonetic substitute:', char, replacement, flush=True)

opts = ort.SessionOptions()
opts.intra_op_num_threads = 2
opts.inter_op_num_threads = 1
opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
opts.enable_cpu_mem_arena = False
session = ort.InferenceSession(str(model / 'model.onnx'), opts, providers=['CPUExecutionProvider'])
wave = np.fromfile(audio, dtype=np.float32)
classes = sorted(set(ids + [blank]))
compact = {c: i for i, c in enumerate(classes)}
outputs, seconds = [], []

# Overlapping context avoids a discontinuity at inference chunk boundaries.
for start in range(0, len(wave), 160000):
    lo, hi = max(start-16000, 0), min(start+176000, len(wave))
    sample = wave[lo:hi].copy()
    sample = (sample-sample.mean()) / np.sqrt(sample.var()+1e-7)
    out = session.run(None, {session.get_inputs()[0].name: sample[None, :]})[0][0]
    tim = lo/16000 + (np.arange(len(out))*320+200)/16000
    keep = (tim >= start/16000) & (tim < (start+160000)/16000)
    lp = out[:, classes] - logsumexp(out, axis=1, keepdims=True)
    outputs.append(lp[keep])
    seconds.extend(tim[keep])
    print('Analyzed', round(min(start/16000+10, len(wave)/16000), 2), 'seconds', flush=True)
    del out

scores = np.concatenate(outputs)
tokens = np.full(len(ids)*2+1, compact[blank], dtype=int)
tokens[1::2] = [compact[i] for i in ids]
allow_skip = np.zeros(len(tokens), dtype=bool)
allow_skip[2:] = (tokens[2:] != tokens[:-2]) & (tokens[2:] != compact[blank])
prev = np.full(len(tokens), -np.inf)
prev[0] = 0
back = np.zeros((len(scores), len(tokens)), np.uint8)
for t, score in enumerate(scores):
    step = np.r_[-np.inf, prev[:-1]]
    skip = np.r_[-np.inf, -np.inf, prev[:-2]]
    skip[~allow_skip] = -np.inf
    routes = np.stack([prev, step, skip])
    back[t] = routes.argmax(axis=0)
    prev = routes.max(axis=0) + score[tokens]

state = len(tokens)-1 if prev[-1] >= prev[-2] else len(tokens)-2
path = np.empty(len(scores), dtype=int)
for t in range(len(scores)-1, -1, -1):
    path[t] = state
    state -= int(back[t, state])

chars = []
for i, ch in enumerate(text):
    hits = np.flatnonzero(path == i*2+1)
    chars.append({'c': ch, 't': round(max(0, seconds[hits[0]]-.04), 3),
                  'end': round(seconds[hits[-1]]+.04, 3)})
result, offset = [], 0
for line in lines:
    groups = line.split('|')
    n = len(''.join(groups))
    part = chars[offset:offset+n]
    result.append({'text': ''.join(groups), 'words': groups,
                   'start': part[0]['t'], 'end': part[-1]['end'],
                   'times': [c['t'] for c in part]})
    offset += n
for i, line in enumerate(result):
    next_start = result[i+1]['start'] if i+1 < len(result) else len(wave)/16000
    line['end'] = round(min(max(line['end']+.45, line['times'][-1]+.65), next_start-.035), 3)
    print(line['start'], line['end'], line['text'], flush=True)
(root / 'src/data/timing.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))