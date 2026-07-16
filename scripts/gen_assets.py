#!/usr/bin/env python3
"""產生 Relax 的圖示 (PNG) 與提示音 (WAV)，純標準函式庫。"""
import struct, zlib, math, os, sys

OUT = sys.argv[1]  # chrome-extension 目錄

# ---------- PNG ----------
def write_png(path, w, h, pixels):
    """pixels: list of (r,g,b,a) length w*h"""
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter type 0
        for x in range(w):
            r, g, b, a = pixels[y * w + x]
            raw += bytes((r, g, b, a))
    def chunk(typ, data):
        c = typ + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)  # 8-bit RGBA
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))

def draw_tomato(size):
    px = [(0, 0, 0, 0)] * (size * size)
    cx, cy = size / 2.0, size * 0.58
    r = size * 0.40
    def blend(base, col, a):
        return tuple(int(base[i] * (1 - a) + col[i] * a) for i in range(3))
    for y in range(size):
        for x in range(size):
            i = y * size + x
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            # 蕃茄本體 (紅色圓，略扁)
            d = math.sqrt(dx * dx + (dy * 1.05) ** 2)
            aa = max(0.0, min(1.0, (r - d) + 0.5))
            if aa > 0:
                # 加一點高光讓它立體
                shade = max(0.0, 1 - (dx * 0.6 + dy * 0.6) / (size * 0.9))
                base = (226, 85, 78)
                hi = (240, 120, 110)
                col = tuple(int(base[k] * (1 - 0.35 * shade) + hi[k] * 0.35 * shade) for k in range(3))
                px[i] = (col[0], col[1], col[2], int(255 * aa))
            # 綠色葉子/蒂頭 (頂端小三角)
            lx, ly = x + 0.5 - cx, y + 0.5 - (size * 0.20)
            if abs(lx) < size * 0.16 and abs(ly) < size * 0.11:
                la = 1 - (abs(lx) / (size * 0.16))
                if la > 0.15:
                    g = (76, 165, 92)
                    prev = px[i]
                    if prev[3] == 0:
                        px[i] = (g[0], g[1], g[2], int(255 * min(1.0, la + 0.3)))
                    else:
                        c = blend(prev[:3], g, min(1.0, la))
                        px[i] = (c[0], c[1], c[2], 255)
    return px

os.makedirs(os.path.join(OUT, "icons"), exist_ok=True)
for s in (16, 32, 48, 128):
    write_png(os.path.join(OUT, "icons", f"icon{s}.png"), s, s, draw_tomato(s))
    print("icon", s)

# ---------- WAV (chime) ----------
def write_wav(path, samples, rate=44100):
    data = bytearray()
    for s in samples:
        v = int(max(-1.0, min(1.0, s)) * 32767)
        data += struct.pack("<h", v)
    with open(path, "wb") as f:
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + len(data)))
        f.write(b"WAVEfmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16))
        f.write(b"data")
        f.write(struct.pack("<I", len(data)))
        f.write(data)

def chime():
    rate = 44100
    out = []
    # 兩個上行音 (E5, A5) 各帶指數衰減，像溫和的鈴聲
    notes = [(659.25, 0.0, 0.45), (880.0, 0.18, 0.55)]
    dur = 0.8
    n = int(rate * dur)
    for i in range(n):
        t = i / rate
        v = 0.0
        for freq, start, amp in notes:
            if t >= start:
                td = t - start
                env = math.exp(-td * 5.0)
                v += amp * env * math.sin(2 * math.pi * freq * td)
        out.append(v * 0.6)
    return out, rate

os.makedirs(os.path.join(OUT, "sounds"), exist_ok=True)
samples, rate = chime()
write_wav(os.path.join(OUT, "sounds", "chime.wav"), samples, rate)
print("chime.wav", len(samples), "samples")
