"""Write editable line, word and character captions from one measured timeline."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/media'
lines = json.loads((ROOT / 'src/data/timing.json').read_text())


def timestamp(t, ass=False):
    if ass:
        n = round(t * 100)
        return f'{n//360000}:{n//6000%60:02d}:{n//100%60:02d}.{n%100:02d}'
    n = round(t * 1000)
    return f'{n//3600000:02d}:{n//60000%60:02d}:{n//1000%60:02d},{n%1000:03d}'


OUT.mkdir(parents=True, exist_ok=True)
for i, line in enumerate(lines):
    assert ''.join(line['words']) == line['text']
    assert len(line['times']) == len(line['text'])
    assert all(a < b for a, b in zip(line['times'], line['times'][1:]))
    assert line['times'][-1] < line['end']
    assert i == 0 or lines[i-1]['end'] <= line['start']

(OUT / 'lyrics.srt').write_text('\n\n'.join(
    f'{i+1}\n{timestamp(l["start"])} --> {timestamp(l["end"])}\n{l["text"]}'
    for i, l in enumerate(lines))+'\n')
(OUT / 'word-timings.json').write_text(json.dumps(lines, ensure_ascii=False, indent=2)+'\n')

header = '''[Script Info]
Title: Someone Like Me | Whale Cinema
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes
WrapStyle: 2
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Film,Noto Serif CJK SC,48,&H00EDF6F6,&H0067878A,&H002F2910,&H88221910,0,0,0,0,100,100,0,0,1,1,2,5,40,40,45,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''

for mode in ['character', 'word']:
    events = []
    for index, line in enumerate(lines):
        intimate = line['text'] == '譬如我'
        size = 75 if intimate else 42 if len(line['text']) > 12 else 48
        advance, space = size*1.09, size*.16
        width = advance*len(line['text']) + space*(len(line['words'])-1)
        x, y, offset = (1280-width)/2 + advance/2, 720*(.77 if intimate else .85), 0
        for word in line['words']:
            word_start = line['times'][offset]
            for ch in word:
                onset = line['times'][offset]
                start = onset if mode == 'character' else word_start
                highlight = round((onset-start)*1000)
                color = '&HA1E1FF&' if index == 40 else '&HEDF6B2&'
                tags = (f'\\an5\\fs{size}\\move({x:.1f},{y+20:.1f},{x:.1f},{y:.1f},0,260)'
                        '\\frx14\\fry-34\\fscx78\\fscy78\\fad(60,110)'
                        '\\t(0,260,\\frx0\\fry0\\fscx100\\fscy100)'
                        f'\\t({highlight},{highlight+25},\\1c{color})'
                        f'\\t({highlight+280},{highlight+400},\\1c&HEDF6F6&)')
                events.append(f'Dialogue: 0,{timestamp(start, True)},{timestamp(line["end"], True)},Film,,0,0,0,,{{{tags}}}{ch}')
                x += advance
                offset += 1
            x += space
    (OUT / f'lyrics-{mode}.ass').write_text(header+'\n'.join(events)+'\n', encoding='utf-8-sig')
print(f'Exported {len(lines)} lines, {sum(len(l["words"]) for l in lines)} word groups and {sum(len(l["text"]) for l in lines)} characters.')