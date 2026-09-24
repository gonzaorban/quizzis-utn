# Dev helper: renders the theory PDF page behind each high-confidence "source" as an image, so the review can
# show it without opening the PDF. Writes sources/pages/<pdf>-p<N>.webp and sets "source.img" on the question;
# questions whose source is not high confidence lose "source.img". Safe to run again after changing sources.
# Requires PyMuPDF and Pillow (pip install pymupdf pillow). Usage:
#   python scripts/render-source-pages.py <slug>
import io
import json
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops

WIDTH = 1280  # px; the slides are landscape, so this keeps small text legible on a phone when zoomed
QUALITY = 80

root = Path(__file__).resolve().parent.parent
if len(sys.argv) != 2:
    sys.exit("uso: python scripts/render-source-pages.py <slug>")
subject = root / "subjects" / sys.argv[1]
qpath = subject / "questions.json"
data = json.loads(qpath.read_text(encoding="utf-8"))
out = subject / "sources" / "pages"
out.mkdir(exist_ok=True)

docs, used = {}, set()
for q in data["questions"]:
    src = q.get("source")
    if not src:
        continue
    if src.get("confidence") != "high":
        src.pop("img", None)
        continue
    name = f"{Path(src['file']).stem}-p{src['page']}.webp"
    src["img"] = f"sources/pages/{name}"
    if name in used:
        continue
    used.add(name)
    doc = docs.setdefault(src["file"], pymupdf.open(subject / src["file"]))
    page = doc[src["page"] - 1]
    pix = page.get_pixmap(matrix=pymupdf.Matrix(WIDTH / page.rect.width, WIDTH / page.rect.width), alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    # trim the white bands around 16:9 slides printed on A4
    box = ImageChops.difference(img, Image.new("RGB", img.size, "white")).convert("L").point(lambda v: 255 if v > 12 else 0).getbbox()
    if box:
        img = img.crop(box)
    img.save(out / name, "WEBP", quality=QUALITY, method=6)

for stale in out.glob("*.webp"):
    if stale.name not in used:
        stale.unlink()

qpath.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
print(f"{len(used)} páginas renderizadas en {out.relative_to(root)}")
