import io
import logging
import base64
import binascii
import torch

from fastapi import FastAPI
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError
from transformers import CLIPModel, CLIPProcessor


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("clip-service")

MODEL_NAME = "openai/clip-vit-base-patch32"
MAX_IMAGE_BYTES = 10 * 1024 * 1024

CATEGORY_LABELS = {
    "book": ["a textbook", "a book", "a study guide", "a novel"],
    "electronics": [
        "a laptop",
        "a phone",
        "a tablet",
        "a pair of headphones",
        "a charger or cable",
        "a computer monitor",
        "a keyboard or mouse",
        "a USB drive or hard drive",
        "a smartwatch",
        "a speaker",
        "an electronic device",
    ],
    "stationery": [
        "a pen or pencil",
        "a notebook",
        "a calculator",
        "a ruler",
        "an eraser",
        "a stapler",
        "a highlighter or marker",
        "a geometry set",
        "school or office supplies",
    ],
    "furniture": [
        "a chair",
        "a desk or table",
        "a lamp",
        "a bookshelf",
        "a bed or mattress",
        "a piece of furniture",
    ],
    "clothing": [
        "an item of clothing",
        "a pair of shoes",
        "a backpack or bag",
        "a jacket or hoodie",
        "a lab coat",
    ],
}

NEGATIVE_LABELS = [
    "a person",
    "an animal",
    "a car",
    "food",
    "a landscape",
    "a screenshot",
    "a meme",
]

_PROMPT_ITEMS = [
    (cat, item) for cat, items in CATEGORY_LABELS.items() for item in items
] + [("_neg", item) for item in NEGATIVE_LABELS]

PROMPTS = [f"a photo of {item}" for _, item in _PROMPT_ITEMS]
OWNERS = [owner for owner, _ in _PROMPT_ITEMS]
ITEMS = [item for _, item in _PROMPT_ITEMS]

logger.info(f"Loading {MODEL_NAME}...")
model = CLIPModel.from_pretrained(MODEL_NAME)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model.eval()
logger.info("Model ready.")

app = FastAPI(title="UniTrade CLIP Service")

MAX_64_LEN = (MAX_IMAGE_BYTES * 4) // 3 + 16


class ScoreRequest(BaseModel):
    imageBase64: str = Field(..., min_length=1, max_length=MAX_64_LEN)
    claimedLabel: str = Field(..., min_length=1, max_length=200)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/score")
def score(req: ScoreRequest):
    image = _decode_base64(req.imageBase64)
    if image is None:
        return {"matchScore": None, "error": "image_unreadable"}

    try:
        result = _score_image(image, req.claimedLabel)
    except Exception:
        logger.exception("Inference failed")
        return {"matchScore": None, "error": "inference_failed"}

    if result is None:
        return {"matchScore": None, "error": "category_not_scorable"}

    return result

class EmbedRequest(BaseModel):
    imageBase64: str = Field(..., min_length=1, max_length=MAX_64_LEN)

@app.post("/embed")
def embed(req: EmbedRequest):
    image = _decode_base64(req.imageBase64)
    if image is None:
        return {"embedding": None, "error": "image_unreadable"}

    try:
        vec = _embed_image(image)
    except Exception:
        logger.exception("Embed inference failed")
        return {"embedding": None, "error": "inference_failed"}

    return {"embedding": vec}


def _embed_image(image: Image.Image) -> list[float]:
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        feats = model.get_image_features(**inputs)

    if not torch.is_tensor(feats):
        for name in ("image_embeds", "pooler_output"):
            value = getattr(feats, name, None)
            if value is not None:
                feats = value
                break

    feats = feats / feats.norm(dim=-1, keepdim=True)
    return feats[0].cpu().tolist()

def _probabilities(image: Image.Image) -> list[float]:
    inputs = processor(
        text=PROMPTS,
        images=image,
        return_tensors="pt",
        padding=True,
    )

    with torch.no_grad():
        outputs = model(**inputs)
        return outputs.logits_per_image.softmax(dim=1)[0].tolist()


def _decode_base64(payload: str) -> Image.Image | None:
    if not payload or len(payload) > (MAX_IMAGE_BYTES * 4) // 3 + 16:
        logger.warning("Encoded payload too large or empty")
        return None

    try:
        raw = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as e:
        logger.warning(f"Base64 decode failed: {e}")
        return None

    if len(raw) > MAX_IMAGE_BYTES:
        logger.warning(f"Decoded image too large ({len(raw)} bytes)")
        return None

    try:
        image = Image.open(io.BytesIO(raw))
        image.load()
        return image.convert("RGB")
    except (UnidentifiedImageError, OSError) as e:
        logger.warning(f"Image decode failed: {e}")
        return None


def _score_image(image: Image.Image, label: str) -> dict | None:
    key = label.strip().lower()

    if key not in CATEGORY_LABELS:
        return None

    probs = _probabilities(image)

    match_score = sum(p for p, owner in zip(probs, OWNERS) if owner == key)

    top = max(range(len(probs)), key=probs.__getitem__)

    return {
        "matchScore": round(match_score, 4),
        "topLabel": ITEMS[top],
        "topLabelScore": round(probs[top], 4),
    }


def debug_scores(image: Image.Image, top_k: int = 5) -> None:
    probs = _probabilities(image)

    ranked = sorted(zip(probs, OWNERS, PROMPTS), reverse=True)[:top_k]

    for p, owner, prompt in ranked:
        print(f"{p:.3f} [{owner}] {prompt}")
