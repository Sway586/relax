#!/usr/bin/env python3
"""把現有 PNG 打包成 .ico（PNG-in-ICO，Windows Vista+ 支援）。"""
import struct, sys, os

png_dir = sys.argv[1]     # icons 目錄
out = sys.argv[2]         # 輸出 .ico 路徑
sizes = [16, 32, 48, 128]

entries = []
for s in sizes:
    with open(os.path.join(png_dir, f"icon{s}.png"), "rb") as f:
        entries.append((s, f.read()))

# ICONDIR
data = struct.pack("<HHH", 0, 1, len(entries))
offset = 6 + 16 * len(entries)
image_blobs = b""
for (s, blob) in entries:
    w = 0 if s >= 256 else s
    h = 0 if s >= 256 else s
    data += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(blob), offset)
    offset += len(blob)
    image_blobs += blob

with open(out, "wb") as f:
    f.write(data + image_blobs)
print("wrote", out, offset, "bytes total")
