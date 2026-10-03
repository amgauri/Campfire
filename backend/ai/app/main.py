import os
import tempfile
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.matching import match_user, find_matches
from app.services.recommendation import rank_posts
from app.services.moderation import moderate_text
from app.services.image_moderation import moderate_image

app = FastAPI(
    title="Campfire AI Service",
    description="AI services for the Campfire campus social platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str

class RecommendationRequest(BaseModel):
    posts: List[dict]

class MatchRequest(BaseModel):
    user: dict
    candidates: List[dict]

class MatchesRequest(BaseModel):
    candidates: List[dict]

@app.get("/")
def home():
    return {
        "service": "campfire-ai",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/moderate/text")
def moderate_text_endpoint(request: TextRequest):
    return moderate_text(request.text)


@app.post("/moderate/image")
async def moderate_image_endpoint(file: UploadFile = File(...)):
    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        dir="models"
    )

    try:
        content = await file.read()

        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Image file is too large. Maximum size is 10 MB."
            )

        temp_file.write(content)
        temp_file.close()

        return moderate_image(temp_file.name)

    finally:
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)

@app.post("/recommend")
def recommend(request: RecommendationRequest):
    return rank_posts(request.posts)

@app.post("/match")
def match(request: MatchRequest):
    return match_user(
        request.user,
        request.candidates
    )

@app.post("/matches")
def matches(request: MatchesRequest):
    return find_matches(request.candidates)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "campfire-ai"
    }

@app.get("/info")
def info():
    return {
        "service": "campfire-ai",
        "version": "1.0.0",
        "features": [
            "text_moderation",
            "image_moderation",
            "feed_recommendation",
            "surge_matching"
        ]
    }