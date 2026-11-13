import json
import os
import subprocess

import imageio_ffmpeg
import numpy as np

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
movie = "public/assets/back-to-back-mv.mp4"
music = "public/assets/back-to-back.mp3"

# Decode every frame and audio packet, not only the file header.
decoded = subprocess.run(
    [ffmpeg, "-v", "error", "-i", movie, "-f", "null", "-"],
    capture_output=True,
    text=True,
    check=True,
)
assert not decoded.stderr.strip(), decoded.stderr


def pcm(filename):
    result = subprocess.run(
        [ffmpeg, "-v", "error", "-i", filename, "-vn", "-ac", "1",
         "-ar", "8000", "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    )
    return np.frombuffer(result.stdout, dtype=np.float32)


source = pcm(music)
rendered = pcm(movie)
length = min(len(source), len(rendered))
correlation = float(np.corrcoef(source[:length], rendered[:length])[0, 1])
rms = float(np.sqrt(np.mean(rendered ** 2)))
assert correlation > 0.97, correlation
assert rms > 0.005, rms
assert os.path.getsize(movie) > 1000000

report = {
    "fullDecode": "passed",
    "fileSizeBytes": os.path.getsize(movie),
    "sourceAudioDuration": len(source) / 8000,
    "renderedAudioDuration": len(rendered) / 8000,
    "audioCorrelationAtZeroOffset": correlation,
    "audioRms": rms,
    "captionTiming": "Line timings sampled; character timings interpolated and not human-listening verified.",
}
with open("reference/media-qa.json", "w") as handle:
    json.dump(report, handle, indent=2)
print(json.dumps(report, indent=2))