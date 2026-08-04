"""Generate simple PNG icons (blue rounded tile + white map-pin) with no deps."""
import struct, zlib, math, os

OUT = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT, exist_ok=True)

BG = (37, 99, 235)     # accent blue
FG = (255, 255, 255)   # white pin


def draw(size):
    px = [[(15, 17, 21, 0) for _ in range(size)] for _ in range(size)]  # RGBA
    r = size * 0.22  # corner radius

    def in_rounded(x, y):
        cx = min(max(x, r), size - r)
        cy = min(max(y, r), size - r)
        return (x - cx) ** 2 + (y - cy) ** 2 <= r * r

    # pin geometry
    pin_cx = size / 2
    pin_cy = size * 0.40
    pin_r = size * 0.20
    tip_y = size * 0.82

    for y in range(size):
        for x in range(size):
            if not in_rounded(x + 0.5, y + 0.5):
                continue
            color = BG
            # pin head (circle)
            if (x + 0.5 - pin_cx) ** 2 + (y + 0.5 - pin_cy) ** 2 <= pin_r ** 2:
                color = FG
            # pin tail (triangle down to tip)
            elif y >= pin_cy:
                half = pin_r * (1 - (y - pin_cy) / (tip_y - pin_cy))
                if half > 0 and abs(x + 0.5 - pin_cx) <= half:
                    color = FG
            # inner hole
            if color == FG:
                if (x + 0.5 - pin_cx) ** 2 + (y + 0.5 - pin_cy) ** 2 <= (pin_r * 0.38) ** 2:
                    color = BG
            px[y][x] = (color[0], color[1], color[2], 255)
    return px


def write_png(path, px):
    size = len(px)
    raw = bytearray()
    for row in px:
        raw.append(0)  # filter type 0
        for (r, g, b, a) in row:
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


for s in (16, 48, 128):
    write_png(os.path.join(OUT, f"icon{s}.png"), draw(s))
    print("wrote", f"icon{s}.png")
