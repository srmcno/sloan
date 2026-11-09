#!/usr/bin/env python3
"""Make small preview copies of every image for the photo and record galleries.

img/<path>.<ext>  ->  img/thumbs/<path>.jpg   (longest side 640 px, JPEG quality 78)

Run from the site folder after adding images:  python3 make_thumbs.py
Only missing or out-of-date thumbnails are rebuilt. The gallery falls back to the
full image if a thumbnail is missing, so forgetting to run this never breaks a page.
Needs Pillow (pip install pillow).
"""
import os
import sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "img")
DST = os.path.join(SRC, "thumbs")
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif")
MAX = 640

made = kept = failed = 0
for folder, dirs, files in os.walk(SRC):
    if os.path.abspath(folder).startswith(DST):
        continue
    for name in files:
        if not name.lower().endswith(EXTS):
            continue
        src = os.path.join(folder, name)
        rel = os.path.relpath(src, SRC)
        out = os.path.join(DST, os.path.splitext(rel)[0] + ".jpg")
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
            kept += 1
            continue
        try:
            with Image.open(src) as im:
                im = ImageOps.exif_transpose(im)
                if im.mode in ("RGBA", "LA", "P"):
                    im = im.convert("RGBA")
                    bg = Image.new("RGB", im.size, (255, 255, 255))
                    bg.paste(im, mask=im.split()[-1])
                    im = bg
                else:
                    im = im.convert("RGB")
                im.thumbnail((MAX, MAX), Image.LANCZOS)
                os.makedirs(os.path.dirname(out), exist_ok=True)
                im.save(out, "JPEG", quality=78, optimize=True, progressive=True)
                made += 1
        except Exception as e:  # unreadable file: the gallery falls back to the original
            failed += 1
            print("skip", rel, e, file=sys.stderr)
print(f"thumbnails: {made} made, {kept} up to date, {failed} skipped")
