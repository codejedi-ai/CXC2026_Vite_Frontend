"""
LiveKit token server for frontend connection.

Run with: uvicorn token_server:app --reload --port 8765

The frontend calls GET /api/token?room=ROOM&identity=USER to get a JWT.
Uses LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET from .env.
"""
import os
from datetime import timedelta

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from livekit.api.access_token import AccessToken, VideoGrants

load_dotenv()

app = FastAPI(
    title="LiveKit Token API",
    description="Issue LiveKit access tokens for the voice agent frontend.",
)

# Allow frontend (different origin) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your frontend origin in production, e.g. ["https://your-app.netlify.app"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class TokenRequest(BaseModel):
    room: str = "voice-room"
    identity: str = "user"
    name: str | None = None


class TokenResponse(BaseModel):
    token: str
    url: str


def _get_livekit_url() -> str:
    url = os.getenv("LIVEKIT_URL", "").strip()
    if not url:
        raise ValueError("LIVEKIT_URL is not set in environment")
    # Ensure wss:// for frontend
    if url.startswith("https://"):
        url = "wss://" + url.removeprefix("https://")
    elif not url.startswith("wss://"):
        url = "wss://" + url
    return url


@app.get("/api/token", response_model=TokenResponse)
@app.post("/api/token", response_model=TokenResponse)
def get_token(
    room: str = "voice-room",
    identity: str = "user",
    name: str | None = None,
):
    """Issue a LiveKit access token so the frontend can join a room."""
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    if not api_key or not api_secret:
        raise HTTPException(
            status_code=500,
            detail="LiveKit API key/secret not configured (LIVEKIT_API_KEY, LIVEKIT_API_SECRET)",
        )
    try:
        livekit_url = _get_livekit_url()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    token = (
        AccessToken(api_key=api_key, api_secret=api_secret)
        .with_identity(identity)
        .with_grants(VideoGrants(room_join=True, room=room))
        .with_ttl(timedelta(hours=1))
    )
    if name:
        token = token.with_name(name)
    jwt_token = token.to_jwt()

    return TokenResponse(token=jwt_token, url=livekit_url)


@app.post("/api/token/body", response_model=TokenResponse)
def get_token_body(body: TokenRequest):
    """Issue a token from JSON body (room, identity, name)."""
    return get_token(room=body.room, identity=body.identity, name=body.name)


@app.get("/api/health")
def health():
    """Health check; confirms LIVEKIT_URL is set."""
    try:
        url = _get_livekit_url()
        return {"ok": True, "livekit_url_set": bool(url)}
    except ValueError:
        return {"ok": True, "livekit_url_set": False}
