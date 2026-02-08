# Rime LiveKit Agents – Technical Overview

## Project Summary

This project is a Python-based, real-time conversational AI agent system built on top of [LiveKit](https://livekit.io/) and [Rime.ai](https://www.rime.ai/). It enables hyper-realistic, character-driven voice agents that can join LiveKit audio rooms, respond to users in natural language, and speak with expressive, customizable voices. The system leverages advanced TTS (text-to-speech) models, OpenAI LLMs (large language models), and a modular plugin architecture for extensibility.

---

## Table of Contents

- [Project Summary](#project-summary)
- [Folder Structure](#folder-structure)
- [Key Components](#key-components)
- [Core Technologies](#core-technologies)
- [Setup & Installation](#setup--installation)
- [Environment Variables & API Keys](#environment-variables--api-keys)
- [Running the Agent](#running-the-agent)
- [Customization & Prompt Engineering](#customization--prompt-engineering)
- [Technical Notes](#technical-notes)
- [Demo/Deployment Tips](#demodeployment-tips)
- [References](#references)

---

## Folder Structure

```
rime-livekit-agents/
│
├── .env                  # Environment variables (API keys, URLs)
├── agent_configs.py      # Voice/personality configs and prompt engineering
├── agent_template/       # Agent config JSONs (Wei, Eliza, Katerina, Ludia, Osmond, Dex)
├── rime_agent.py         # Main agent logic and entrypoint
├── requirements.txt      # Python dependencies
├── text_utils.py         # Custom sentence tokenizer for TTS
├── TECHNICAL_OVERVIEW.md # This technical documentation
├── README.md             # Basic project info
├── KMS/                  # (Optional) Key Management Service or logs
│   └── logs/
└── __pycache__/          # Python bytecode cache
```

---

## Key Components

### 1. `rime_agent.py`

- Main entry point for the agent.
- Handles LiveKit room connection, session management, plugin integration, and event loop.
- Integrates TTS, LLM, STT, noise cancellation, and turn detection.

### 2. `agent_configs.py`

- Defines agent personalities, TTS settings, and prompt engineering.
- Example: `"celeste"` persona with a clingy, playful, flirty university girlfriend style.
- Each persona can have unique TTS speed, model, and prompt.

### 3. `text_utils.py`

- Implements custom sentence tokenization for advanced TTS models (e.g., Arcana).

---

## Core Technologies

- **LiveKit**: Real-time audio/video infrastructure for scalable, multi-user rooms.
- **Rime.ai**: Hyper-realistic TTS models ("arcana", "mistv2").
- **OpenAI**: LLMs (e.g., GPT-4o-mini) for generating conversational responses.
- **Python 3.11+**: All orchestration and logic.
- **LiveKit Plugins**: For noise cancellation, turn detection, and TTS enhancements.

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/uw-datasci/AI-GF.git
```

### 2. Create and Activate a Virtual Environment

**Windows:**

```powershell
python -m venv .venv
.venv\Scripts\activate
```

**macOS/Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Download Model Files

```bash
python rime_agent.py download-files
```

This will download any required TTS or turn detection models.

---

## Environment Variables & API Keys

Create a `.env` file in the project root with the following keys:

```env
LIVEKIT_URL=wss://<your-livekit-server>.livekit.cloud
LIVEKIT_API_KEY=<your-livekit-api-key>
LIVEKIT_API_SECRET=<your-livekit-api-secret>

OPENAI_API_KEY=<your-openai-api-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
RIME_API_KEY=<your-rime-api-key>

```

**Required API Keys:**

- **LiveKit**: For connecting to your LiveKit Cloud or self-hosted server.
- **OpenAI**: For LLM responses (ensure your key has quota).
- **Anthropic**: Required when using an agent config with `"llm_provider": "anthropic"`. Get a key at [console.anthropic.com](https://console.anthropic.com/).
- **Rime.ai**: For TTS (Arcana, Mistv2, etc.).

**Note:**

- Do **not** surround values with quotes unless the value contains spaces (quotes can cause `invalid x-api-key` with Anthropic).
- If you see quota errors, check your OpenAI or Rime.ai usage and billing.
- If you see `401 invalid x-api-key` with Anthropic, ensure `ANTHROPIC_API_KEY` is set, has no extra quotes/spaces, and is a valid key from the Anthropic console.

---

## Running the Agent

### 1. Console Mode (Debugging)

Run the agent in console mode for local testing:

```bash
python rime_agent.py console
```

### 2. LiveKit Mode (Production/Demo)

Connects the agent to a LiveKit room:

```bash
python rime_agent.py dev
```

- Ensure all required environment variables are set in `.env`.
- The agent will join the specified LiveKit room and respond to participants.

### 3. Stopping the Agent

- Press `Ctrl + C` in the terminal to stop the agent at any time.

---

## Connecting the Frontend (Web App)

To connect a web frontend (e.g. a React app using `livekit-client`) to this agent:

1. **Start the token server** (in the AI-GF project):

   ```bash
   uvicorn token_server:app --reload --port 8765
   ```

   This serves `GET /api/token?room=ROOM&identity=USER` and returns a LiveKit JWT and server URL. It uses the same `.env` (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`).

2. **Start the agent** (in another terminal):

   ```bash
   python rime_agent.py dev
   ```

   The agent will connect to LiveKit and join rooms when participants join.

3. **Configure the frontend** to use the token server:

   - Set `VITE_LIVEKIT_TOKEN_API=http://localhost:8765` in the frontend’s `.env` (or your token server URL in production).
   - In the Voice Chat UI, use **Quick connect** with room name `voice-room` (or the same room name your agent is dispatching to). The frontend will request a token from the token server and then connect to LiveKit.

4. **CORS**: The token server allows all origins by default. For production, restrict `allow_origins` in `token_server.py` to your frontend origin.

---

## Customization & Prompt Engineering

- Edit `agent_configs.py` to:
  - Add new personas (copy the `"celeste"` config and modify).
  - Change TTS speed (`"speed_alpha"`), model, or speaker.
  - Update the `llm_prompt` for different conversational styles.
  - Adjust `intro_phrase` for custom greetings.

**Example:**

```python
"celeste": {
    "tts_options": {
        "model": "arcana",
        "speaker": "celeste",
        "speed_alpha": 1.0,  # 1.0 = normal speed
        ...
    },
    "llm_prompt": "...",
    "intro_phrase": "hey cutie... <laugh> I was just thinking about you. what are you up to?",
}
```

- Lower `"speed_alpha"` if TTS is too fast for avatar sync.

---

## Technical Notes

- **Dependencies:**
  - Uses a forked version of `livekit-plugins-rime` for improved Arcana support (see `requirements.txt`).
  - All audio processing, TTS, and LLM calls are asynchronous for low latency.
- **Plugins:**
  - Noise cancellation (`livekit-plugins-noise-cancellation`)
  - Turn detection (`livekit-plugins-turn-detector`)
- **Extensibility:**
  - Add new plugins, voices, or logic by extending the agent/session classes.
- **Microphone Selection:**
  - By default, uses the system default input device.
  - To change, modify the code to set the desired device index using `sounddevice` or relevant library.

---

## Demo/Deployment Tips

- **For Demos:**

  - Highlight real-time, character-driven voice interaction.
  - Show expressive TTS and persona switching.
  - Demonstrate easy customization via `agent_configs.py`.
  - Explain integration with LiveKit for scalable audio rooms.

- **For Production:**
  - Deploy on a cloud VM or service (e.g., Render, AWS, Azure).
  - Use secure storage for API keys.
  - Monitor usage and quotas for OpenAI and Rime.ai.
  - Optionally, connect a web or mobile frontend via LiveKit APIs.

---

## Troubleshooting

- **Quota Errors:**
  - If you see `insufficient_quota` or 429 errors, check your OpenAI or Rime.ai account usage and billing.
- **Audio Sync Issues:**
  - If TTS audio is faster than the avatar, lower `"speed_alpha"` in `agent_configs.py`.
- **Missing Dependencies:**
  - Re-run `pip install -r requirements.txt` in your activated virtual environment.
- **Microphone Issues:**
  - Ensure your preferred input device is set as default, or modify the code to select a specific device.

---

## References

- [LiveKit Agents Documentation](https://docs.livekit.io/agents/overview/)
- [Rime.ai](https://www.rime.ai/)
- [LiveKit Cloud](https://livekit.io/cloud)
- [OpenAI Platform](https://platform.openai.com/)
---

_This document provides a comprehensive technical overview and setup guide for the Rime LiveKit Agents project. For further details, see the codebase and README._
