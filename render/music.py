"""Tạo nhạc nền và âm hiệu ứng cho video (tự tổng hợp bằng code, không dính bản quyền).

Cách dùng: python3 render/music.py video/public/
Tạo ra: music.wav (60 giây, 112 BPM, vòng hợp âm C-G-Am-F), whoosh.wav, pop.wav
"""

import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
BPM = 112
BEAT = 60 / BPM
rng = np.random.default_rng(24)

NOTES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def hz(name, octave):
    return 440 * 2 ** ((NOTES[name] + 12 * (octave + 1) - 69) / 12)


CHORDS = [  # (gốc, các nốt của hợp âm)
    ("C", [("C", 4), ("E", 4), ("G", 4)]),
    ("G", [("B", 3), ("D", 4), ("G", 4)]),
    ("A", [("C", 4), ("E", 4), ("A", 4)]),
    ("F", [("C", 4), ("F", 4), ("A", 4)]),
]


def tone(freq, dur, harmonics=6, detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for n in range(1, harmonics + 1):
        out += np.sin(2 * np.pi * freq * (1 + detune) * n * t + rng.uniform(0, 6.28)) / n
    return out


def env(n, attack, release_power=1.0):
    e = np.ones(n)
    a = max(1, int(attack * SR))
    e[:a] = np.linspace(0, 1, a)
    return e * np.linspace(1, 0, n) ** release_power


def lowpass(x, alpha):
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y


def add(track, sig, start):
    s = int(start * SR)
    e = min(len(track), s + len(sig))
    if s < len(track):
        track[s:e] += sig[: e - s]


def kick():
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    freq = 45 + 85 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 9)


def clap():
    n = int(0.22 * SR)
    noise = rng.normal(0, 1, n)
    noise = noise - lowpass(noise, 0.12)
    return noise * np.exp(-np.arange(n) / SR * 22) * 0.6


def hat():
    n = int(0.05 * SR)
    noise = rng.normal(0, 1, n)
    noise = noise - lowpass(noise, 0.5)
    return noise * np.exp(-np.arange(n) / SR * 90) * 0.35


def music(seconds=60):
    total = int(seconds * SR)
    drums, bass, pad, arp = (np.zeros(total) for _ in range(4))
    duck = np.ones(total)
    k, c, h = kick(), clap(), hat()
    bar = 4 * BEAT
    nbars = int(seconds / bar) + 1
    for b in range(nbars):
        root, notes = CHORDS[b % 4]
        t0 = b * bar
        full = b >= 2  # 2 ô nhịp đầu chỉ có pad và arp, sau đó vào trống
        # Pad: 3 giọng lệch nhẹ cho dày
        for name, octv in notes:
            for d in (-0.004, 0, 0.004):
                sig = tone(hz(name, octv), bar, harmonics=5, detune=d) * env(int(bar * SR), 0.25, 0.4) * 0.05
                add(pad, sig, t0)
        # Arp móc 16 nốt mỗi ô nhịp
        seq = [notes[i % 3] for i in (0, 1, 2, 1, 0, 2, 1, 2)] * 2
        for i, (name, octv) in enumerate(seq):
            n = int(BEAT / 4 * SR * 0.95)
            sig = tone(hz(name, octv + 1), n / SR, harmonics=3) * env(n, 0.003, 3) * 0.09
            add(arp, sig, t0 + i * BEAT / 4)
        if not full:
            continue
        for beat in range(4):
            tb = t0 + beat * BEAT
            add(drums, k * 0.9, tb)
            s = int(tb * SR)
            dn = int(0.28 * SR)
            if s < total:
                duck[s : s + dn] = np.minimum(duck[s : s + dn], np.linspace(0.35, 1, min(dn, total - s)))
            if beat in (1, 3):
                add(drums, c, tb)
            add(drums, h, tb + BEAT / 2)
            # Bass nảy theo nốt móc đơn
            for half in (0, 1):
                n = int(BEAT / 2 * SR * 0.9)
                sig = tone(hz(root, 2), n / SR, harmonics=4) * env(n, 0.005, 1.5) * 0.22
                add(bass, sig, tb + half * BEAT / 2)
    mix = drums + (bass + pad) * duck + arp * (0.6 + 0.4 * duck)
    mix = lowpass(mix, 0.6)
    mix /= np.max(np.abs(mix)) / 0.85
    return mix


def whoosh():
    n = int(0.7 * SR)
    noise = rng.normal(0, 1, n)
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        p = i / n
        alpha = 0.02 + 0.35 * np.sin(np.pi * p) ** 2
        acc += alpha * (noise[i] - acc)
        y[i] = acc
    y *= np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return y / np.max(np.abs(y)) * 0.6


def pop():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    freq = 900 - 500 * t / t[-1]
    y = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 35)
    return y * 0.5


def save(path, data):
    data = np.clip(data, -1, 1)
    pcm = (data * 32767).astype(np.int16)
    stereo = np.column_stack([pcm, pcm]).ravel()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    out.mkdir(parents=True, exist_ok=True)
    save(out / "music.wav", music())
    save(out / "whoosh.wav", whoosh())
    save(out / "pop.wav", pop())
    print(f"Đã tạo music.wav, whoosh.wav, pop.wav trong {out}")
