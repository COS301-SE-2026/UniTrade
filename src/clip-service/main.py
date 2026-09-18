from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class ScoreRequest(BaseModel):
    imageUrl: str
    claimedLabel: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/score")
def score(req: ScoreRequest):
    return {"matchScore": None, "error": "not_implemented"}
