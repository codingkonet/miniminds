#!/usr/bin/env python3
"""TooKKIDS mobile icon generator.

Draws the TooKKIDS brand icon (purple gradient, owl mascot, TooKKIDS wordmark)
and writes every mobile icon in one run:

    icons/icon-512.png          PWA / Android launcher (512)
    icons/icon-192.png          PWA install prompt (192)
    icons/icon-maskable-512.png Android adaptive icon, 80% safe zone (512)
    icons/apple-touch-icon.png  iOS home screen (180, fully opaque)

Usage:  python tools/make-icons.py
Font:   Baloo 2 variable TTF (same family as the website), Arial Black fallback.
All shapes are drawn 4x oversized then downsampled (antialiasing).
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = 512          # design grid
S = 4               # supersampling factor
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")

FONT_CANDIDATES = [
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "Temp", "opencode", "Baloo2.ttf"),
    r"C:\Users\ouag\AppData\Local\Temp\opencode\Baloo2.ttf",
    r"C:\Windows\Fonts\ariblk.ttf",
]
BG_TOP = (95, 82, 224)
BG_BOT = (160, 148, 255)
BODY = (249, 249, 252)
EYE = (46, 42, 97)
BEAK = (244, 160, 79)
SHADOW = (44, 34, 120)


def find_font():
    for p in FONT_CANDIDATES:
        if p and os.path.exists(p):
            return p
    raise SystemExit("no font found")


FONT_PATH = find_font()


def make_font(px):
    try:
        f = ImageFont.truetype(FONT_PATH, px)
        try:
            f.set_variation_by_axes([800])
        except Exception:
            try:
                f.set_variation_by_name("ExtraBold")
            except Exception:
                pass
        return f
    except Exception:
        return ImageFont.load_default()


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(size):
    img = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        d.line([(0, y), (size, y)], fill=lerp(BG_TOP, BG_BOT, y / max(1, size - 1)) + (255,))
    return img


def draw_owl(d, k, top):
    """Owl mascot in original 512-grid space, scaled by k, ears top at `top`."""
    def T(pts):
        return [((256 + (x - 255) * k) * S, (top + (y - 58) * k) * S) for x, y in pts]

    # ears (behind the body)
    d.polygon(T([(128, 58), (214, 150), (149, 180)]), fill=BODY)
    d.polygon(T([(384, 58), (298, 150), (363, 180)]), fill=BODY)
    # body
    (x0, y0), (x1, y1) = T([(92, 115)])[0], T([(420, 440)])[0]
    d.ellipse([x0, y0, x1, y1], fill=BODY)
    # eyes
    for cx0 in (198, 312):
        (ex0, ey0), (ex1, ey1) = T([(cx0 - 76, 160)])[0], T([(cx0 + 76, 312)])[0]
        d.ellipse([ex0, ey0, ex1, ey1], fill=EYE)
    # pupils
    for px0, py0 in ((226, 213), (340, 213)):
        (p0x, p0y), (p1x, p1y) = T([(px0 - 27, py0 - 27)])[0], T([(px0 + 27, py0 + 27)])[0]
        d.ellipse([p0x, p0y, p1x, p1y], fill=BODY)
    # beak
    d.polygon(T([(223, 296), (289, 296), (256, 359)]), fill=BEAK)


def draw_wordmark(img, cy, font_px, max_w):
    txt = "TooKKIDS"
    font = make_font(int(font_px * S))
    probe = ImageDraw.Draw(img)
    x0, y0, x1, y1 = probe.textbbox((0, 0), txt, font=font)
    if (x1 - x0) > max_w * S:
        font = make_font(int(font_px * S * (max_w * S) / (x1 - x0)))
    cx, cyp = BASE * S / 2, cy * S

    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((cx, cyp + 7 * S), txt, font=font, fill=SHADOW + (170,), anchor="mm")
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(int(5 * S / 4))))

    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((cx, cyp), txt, font=font, fill=(255, 255, 255, 255), anchor="mm")
    img.alpha_composite(layer)


def make_icon(mode, out_name, out_size):
    img = gradient(BASE * S)
    d = ImageDraw.Draw(img)
    if mode == "regular":   # full 512 grid
        k, top, cy, fsize, maxw = 0.84, 30, 418, 96, 440
    else:                   # safe zone for maskable / Apple touch (80% circle)
        k, top, cy, fsize, maxw = 0.60, 78, 355, 68, 360
    draw_owl(d, k, top)
    draw_wordmark(img, cy, fsize, maxw)
    img = img.resize((out_size, out_size), Image.LANCZOS).convert("RGB")
    path = os.path.join(OUT, out_name)
    img.save(path, "PNG", optimize=True)
    print(f"{out_name}: {out_size}x{out_size} ({os.path.getsize(path)} bytes)")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    make_icon("regular", "icon-512.png", 512)
    make_icon("regular", "icon-192.png", 192)
    make_icon("safe", "icon-maskable-512.png", 512)
    make_icon("safe", "apple-touch-icon.png", 180)
    print("done - font:", os.path.basename(FONT_PATH))
