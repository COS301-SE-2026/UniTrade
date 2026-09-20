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

COMPETITOR_LABELS = [
    # book
    "a textbook",
    "a book",
    # electronics
    "a laptop",
    "a phone",
    "a tablet",
    "a pair of headphones",
    "a charger or cable",
    # stationery
    "a pen or pencil",
    "a notebook",
    "a calculator",
    # furniture
    "a chair",
    "a desk or table",
    "a lamp",
    # clothing
    "an item of clothing",
    "a pair of shoes",
    "a backpack or bag",
]

CATEGORY_PROMPTS = {
    "book": "a book or textbook",
    "electronics": "a laptop, phone, or electronic device",
    "stationery": "stationery such as a pen, notebook, or calculator",
    "furniture": "a piece of furniture such as a chair, desk, or lamp",
    "clothing": "an item of clothing, shoes, or a bag",
    "other": "an item",
}


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
        match_score = _score_image(image, req.claimedLabel)
    except Exception:
        logger.exception("Inference failed")
        return {"matchScore": None, "error": "inference_failed"}

    return {"matchScore": round(match_score, 4)}


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


def _score_image(image: Image.Image, label: str) -> float:
    claimed = CATEGORY_PROMPTS.get(label.strip().lower(), label)
    prompts = [f"a photo of {claimed}"] + [f"a photo of {c}" for c in COMPETITOR_LABELS]

    inputs = processor(text=prompts, images=image, return_tensors="pt", padding=True)

    with torch.no_grad():
        outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)

    return float(probs[0, 0].item())
