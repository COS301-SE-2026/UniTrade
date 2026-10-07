#!/usr/bin/env python3
import io
import sys
from itertools import combinations
from pathlib import Path

import torch
from PIL import Image, ImageDraw, ImageEnhance, ImageOps
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "openai/clip-vit-base-patch32"
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
THRESHOLDS = [0.85, 0.88, 0.90, 0.92, 0.94, 0.96, 0.98]
MILD = ["mirror", "crop_15pct", "border", "jpeg_q25", "small_25pct", "rotate90", "brighter", "grayscale"]

USAGE = "Usage: python calibrate.py <folder>"

print(f"Loading {MODEL_NAME} ...")
model = CLIPModel.from_pretrained(MODEL_NAME).eval()
processor = CLIPProcessor.from_pretrained(MODEL_NAME)


def load_folder(folder: Path) -> dict:
    if not folder.exists():
        return {}
    out = {}
    for p in sorted(folder.iterdir()):
        if p.suffix.lower() in EXTS:
            out[p.stem] = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
    return out


def embed(images: list) -> torch.Tensor:
    inputs = processor(images=images, return_tensors="pt")
    with torch.no_grad():
        feats = model.get_image_features(**inputs)
    if not torch.is_tensor(feats):
        print(f"note: get_image_features returned {type(feats).__name__}")
        for name in ("image_embeds", "pooler_output"):
            value = getattr(feats, name, None)
            if value is not None:
                feats = value
                break
    return feats / feats.norm(dim=-1, keepdim=True)


def make_edits(img: Image.Image) -> dict:
    w, h = img.size
    edits = {}
    edits["mirror"] = ImageOps.mirror(img)
    dx, dy = int(w * 0.075), int(h * 0.075)
    edits["crop_15pct"] = img.crop((dx, dy, w - dx, h - dy))
    edits["border"] = ImageOps.expand(img, border=int(min(w, h) * 0.08), fill="white")
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=25)
    buf.seek(0)
    edits["jpeg_q25"] = Image.open(buf).convert("RGB")
    edits["small_25pct"] = img.resize((max(1, w // 4), max(1, h // 4)))
    edits["rotate90"] = img.rotate(90, expand=True)
    edits["brighter"] = ImageEnhance.Brightness(img).enhance(1.35)
    edits["grayscale"] = ImageOps.grayscale(img).convert("RGB")
    dx, dy = int(w * 0.2), int(h * 0.2)
    edits["crop_40pct"] = img.crop((dx, dy, w - dx, h - dy))
    banner = img.copy()
    d = ImageDraw.Draw(banner)
    band = max(20, int(h * 0.12))
    d.rectangle((0, h - band, w, h), fill=(20, 20, 20))
    d.text((int(w * 0.04), h - band + band // 3), "SELLER 082 000 0000 - CHEAP!!", fill=(255, 255, 255))
    edits["text_overlay"] = banner
    canvas = Image.new("RGB", (int(w * 1.5), int(h * 1.5)), (235, 235, 235))
    canvas.paste(img, (int(w * 0.25), int(h * 0.25)))
    edits["in_frame"] = canvas
    return edits


def paired(group: dict, base: dict) -> list:
    rows = []
    if not group:
        return rows
    for stem, vec in zip(group, embed(list(group.values()))):
        orig, _, label = stem.partition("__")
        if orig not in base:
            print(f"  skipped {stem}: no original called '{orig}'")
            continue
        rows.append((float(base[orig] @ vec), orig, label or "copy"))
    return rows

def main(root: Path) -> None:
    originals = load_folder(root / "originals")
    if len(originals) < 4:
        sys.exit("Put at least 4 distinct photos in originals/ (8 to 12 is better)")
    lookalikes = load_folder(root / "lookalikes")
    base = dict(zip(originals, embed(list(originals.values()))))

    edit_scores = {}
    for name, img in originals.items():
        edits = make_edits(img)
        for (label, _), vec in zip(edits.items(), embed(list(edits.values()))):
            edit_scores.setdefault(label, []).append((float(base[name] @ vec), name))

    real_rows = paired(load_folder(root / "real_copies"), base)
    same_rows = paired(load_folder(root / "same_item"), base)

    diff_rows = [(float(base[a] @ base[b]), a, b) for a, b in combinations(originals, 2)]
    if lookalikes:
        for lname, lvec in zip(lookalikes, embed(list(lookalikes.values()))):
            for oname, ovec in base.items():
                diff_rows.append((float(ovec @ lvec), oname, f"{lname} (lookalike)"))

    print("\n=== Edited copies of the same photo, per edit type ===")
    print(f"{'edit':<14}{'min':>7}{'mean':>7}   weakest original")
    for label, rows in sorted(edit_scores.items(), key=lambda kv: min(kv[1])[0]):
        lo = min(rows)
        mean = sum(s for s, _ in rows) / len(rows)
        tag = "" if label in MILD else "   (aggressive: informational)"
        print(f"{label:<14}{lo[0]:>7.3f}{mean:>7.3f}   {lo[1]}{tag}")

    if real_rows:
        print("\n=== Real-world copies ===")
        for s, o, label in sorted(real_rows):
            print(f"  {s:.3f}  {o}  ({label})")
    if same_rows:
        print("\n=== Same item, different photo (informational) ===")
        for s, o, label in sorted(same_rows):
            print(f"  {s:.3f}  {o}  ({label})")

    print("\n=== Different items: most similar pairs ===")
    for s, a, b in sorted(diff_rows, reverse=True)[:8]:
        print(f"  {s:.3f}  {a}  vs  {b}")

    must_catch = [s for label in MILD for s, _ in edit_scores.get(label, [])] + [s for s, _, _ in real_rows]
    different = [s for s, _, _ in diff_rows]
    print("\n=== Threshold table (mild edits and real copies must be caught) ===")
    print(f"{'threshold':>9}   {'caught':>12}   {'false alarms':>14}")
    for t in THRESHOLDS:
        caught = sum(s >= t for s in must_catch)
        false = sum(s >= t for s in different)
        print(f"{t:>9.2f}   {caught:>5}/{len(must_catch):<6}   {false:>6}/{len(different):<7}")

    lowest_dup, highest_diff = min(must_catch), max(different)
    print(f"\nlowest true duplicate:  {lowest_dup:.3f}")
    print(f"highest different pair: {highest_diff:.3f}")
    if lowest_dup > highest_diff:
        print(f"Clean gap. A threshold around {(lowest_dup + highest_diff) / 2:.2f} separates them.")
    else:
        print("Overlap: some copies score below some different items. See the tables above.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(USAGE)
    main(Path(sys.argv[1]))