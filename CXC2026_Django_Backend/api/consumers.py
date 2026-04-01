import asyncio
import json
import os

import websockets
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


def _extract_token(scope) -> str | None:
    qs = scope.get("query_string", b"").decode()
    for part in qs.split("&"):
        if part.startswith("token="):
            return part[6:]
    return None


class ChatConsumer(AsyncWebsocketConsumer):
    """
    Relay WebSocket: Frontend <-> Django <-> AI Agent

    Frontend connects to:
        ws://localhost:8000/ws/chat/<profile_id>/?token=<jwt_access_token>

    Django connects outward to the AI agent at:
        AI_AGENT_WS_URL env var (default: ws://localhost:8001/ws/chat)
        Full URL: <AI_AGENT_WS_URL>/<profile_id>/

    All messages are relayed bidirectionally without modification.
    """

    async def connect(self):
        token_str = _extract_token(self.scope)
        if not token_str:
            await self.close(code=4001)
            return

        try:
            token = AccessToken(token_str)
            self.user_id = token["user_id"]
        except TokenError:
            await self.close(code=4001)
            return

        self.profile_id = self.scope["url_route"]["kwargs"]["profile_id"]
        self.agent_ws = None
        self._relay_task = None

        await self.accept()

        agent_base = os.environ.get("AI_AGENT_WS_URL", "ws://localhost:8001/ws/chat")
        try:
            self.agent_ws = await websockets.connect(
                f"{agent_base}/{self.profile_id}/",
                additional_headers={"X-User-Id": str(self.user_id)},
            )
            self._relay_task = asyncio.create_task(self._relay_from_agent())
        except Exception:
            await self.send(json.dumps({"type": "error", "message": "AI agent unavailable"}))

    async def disconnect(self, close_code):
        if self._relay_task:
            self._relay_task.cancel()
        if self.agent_ws:
            try:
                await self.agent_ws.close()
            except Exception:
                pass

    async def receive(self, text_data=None, bytes_data=None):
        if not self.agent_ws:
            await self.send(json.dumps({"type": "error", "message": "No agent connection"}))
            return
        try:
            if text_data:
                await self.agent_ws.send(text_data)
            elif bytes_data:
                await self.agent_ws.send(bytes_data)
        except Exception:
            await self.send(json.dumps({"type": "error", "message": "Failed to reach agent"}))

    async def _relay_from_agent(self):
        """Forward every message from the AI agent back to the frontend."""
        try:
            async for message in self.agent_ws:
                await self.send(text_data=message if isinstance(message, str) else None,
                                bytes_data=message if isinstance(message, bytes) else None)
        except asyncio.CancelledError:
            pass
        except Exception:
            try:
                await self.send(json.dumps({"type": "agent_disconnected"}))
            except Exception:
                pass
