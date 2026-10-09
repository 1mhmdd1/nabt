"""Place each mockup beside the captured app screen."""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

out = Path("/opt/cursor/artifacts/compare")
out.mkdir(parents=True, exist_ok=True)
font = ImageFont.load_default()

for meta in sorted(Path("/tmp").glob("nabt-shot-*.json")):
    row = json.loads(meta.read_text())
    left = Image.open(row["mock"]).convert("RGBA")
    right = Image.open(row["app"]).convert("RGBA")
    gap = 24
    head = 36
    w = left.width + right.width + gap
    h = max(left.height, right.height) + head
    canvas = Image.new("RGB", (w, h), "#1a0707")
    draw = ImageDraw.Draw(canvas)
    draw.text((8, 8), "mockup", fill="white", font=font)
    draw.text((left.width + gap, 8), "app", fill="white", font=font)
    canvas.paste(left, (0, head), left)
    canvas.paste(right, (left.width + gap, head), right)
    dest = out / f"{row['name']}.png"
    canvas.save(dest)
    print("compared", dest.name)
