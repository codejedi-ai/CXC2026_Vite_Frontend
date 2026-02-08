import asyncio
import logging
import json
import os
import sys
import argparse
from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    RunContext,
    tts,
    metrics,
    RoomInputOptions,
    RoomOutputOptions,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.agents.voice import MetricsCollectedEvent
from livekit.plugins import (
    openai,
    anthropic,
    google,
    noise_cancellation,
    rime,
    silero,
    elevenlabs,
)
from livekit.agents.tokenize import tokenizer
from text_utils import ArcanaSentenceTokenizer
from inflection_llm import InflectionLLM
from intro_gen import generate_intro as generate_intro_phrase
from tools.inflection_tool import get_inflection_response

load_dotenv()
logger = logging.getLogger("voice-agent")

# Parse command line arguments for config file
parser = argparse.ArgumentParser(description="Run the AI Agent")
parser.add_argument("--config", type=str, default="Ludia.json", help="Path to the agent configuration JSON file")
args, unknown = parser.parse_known_args()

# Clean sys.argv for the LiveKit CLI (Click) to avoid "no such option: --config" errors
sys.argv = [sys.argv[0]] + unknown

# Load configuration (agent configs live in agent_template/)
CONFIG_FILENAME = os.path.basename(args.config) if os.path.sep in args.config else args.config
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "agent_template", CONFIG_FILENAME)

try:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        AGENT_CONFIG = json.load(f)
    logger.info(f"Loaded configuration from {CONFIG_FILENAME}")
except FileNotFoundError:
    logger.error(f"Configuration file not found at {CONFIG_PATH}")
    # Fallback to Ludia.json if specific config fails? No, better to raise.
    raise
except json.JSONDecodeError:
    logger.error(f"Invalid JSON in configuration file at {CONFIG_PATH}")
    raise

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

class AIChatAgent(Agent):
    def __init__(self) -> None:
        instructions = AGENT_CONFIG.get("personality_prompt", "")
        instructions += "\n\nTOOLS: When the user shares strong emotions, stress, or needs emotional support, consider using the inflection_tool to get Inflection's perspective and use or adapt it in your reply."
        super().__init__(instructions=instructions)

    # Inflection tool is available to ALL agents (shared AIChatAgent).
    @function_tool(
        description="Get a reply from Inflection AI (e.g. Pi). Use when the user shares strong emotions, needs emotional support, or you want a more emotionally attuned reply—then use or adapt Inflection's response in your reply."
    )
    async def inflection_tool(self, ctx: RunContext, user_message: str, model: str = "Pi-3.1") -> str:
        """Call Inflection AI for a response. Use for emotional depth; pass the user's message and optionally model (default Pi-3.1)."""
        system_instruction = AGENT_CONFIG.get("personality_prompt", "")
        return await get_inflection_response(user_message, system_instruction=system_instruction or None, model=model)

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the first participant to connect
    participant = await ctx.wait_for_participant()

    logger.info(f"Running agent {AGENT_CONFIG.get('name', 'unknown')} with participant {participant.identity}")

    # Initialize TTS based on provider
    provider = AGENT_CONFIG.get("provider", "rime").lower()
    voice_options = AGENT_CONFIG.get("voice_options", {})
    
    if provider == "elevenlabs":
        # Extract specific params for ElevenLabs TTS
        el_options = voice_options.copy()
        
        # Map config keys to constructor arguments
        model = el_options.pop("model_id", "eleven_multilingual_v2")
        voice_id = el_options.pop("voice_id", None)
        
        # 'optimize_streaming_latency' in config -> 'streaming_latency' in constructor
        if "optimize_streaming_latency" in el_options:
            el_options["streaming_latency"] = el_options.pop("optimize_streaming_latency")
            
        # Pass explicit args + remaining options
        voice_tts = elevenlabs.TTS(
            model=model,
            voice_id=voice_id,
            **el_options
        )
    else:
        # Default to Rime
        voice_tts = rime.TTS(**voice_options)
        
        # Configure sentence tokenizer for Rime if present
        tokenizer_config = AGENT_CONFIG.get("tokenizer_config")
        if tokenizer_config and tokenizer_config.get("type") == "ArcanaSentenceTokenizer":
            min_len = tokenizer_config.get("min_sentence_len", 1000)
            sentence_tokenizer = ArcanaSentenceTokenizer(min_sentence_len=min_len)
            voice_tts = tts.StreamAdapter(tts=voice_tts, sentence_tokenizer=sentence_tokenizer)

    # Initialize LLM based on provider
    llm_provider = AGENT_CONFIG.get("llm_provider", "openai").lower()
    llm_model = AGENT_CONFIG.get("llm_model", "gpt-4o-mini")
    if llm_provider == "inflection":
        agent_llm = InflectionLLM(model=llm_model)
    elif llm_provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("anthropic_api_key")
        if not api_key or not api_key.strip():
            raise ValueError(
                "ANTHROPIC_API_KEY is not set or is empty. "
                "Add it to your .env or set the environment variable. "
                "Get a key at https://console.anthropic.com/"
            )
        # Strip quotes/whitespace (e.g. from .env) so Anthropic accepts the key
        api_key = api_key.strip().strip('"').strip("'")
        os.environ["ANTHROPIC_API_KEY"] = api_key
        agent_llm = anthropic.LLM(model=llm_model)
    elif llm_provider == "google":
        agent_llm = google.LLM(model=llm_model)
    elif llm_provider == "deepseek":
        api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("deepseek_api_key")
        if not api_key or not api_key.strip():
            raise ValueError(
                "DEEPSEEK_API_KEY is not set or is empty. "
                "Add it to your .env or set the environment variable. "
                "Get a key at https://platform.deepseek.com/"
            )
        api_key = api_key.strip().strip('"').strip("'")
        os.environ["DEEPSEEK_API_KEY"] = api_key
        agent_llm = openai.LLM.with_deepseek(model=llm_model)
    else:
        agent_llm = openai.LLM(model=llm_model)

    session = AgentSession(
        stt=openai.STT(),
        llm=agent_llm,
        tts=voice_tts,
        vad=ctx.proc.userdata["vad"],
        turn_detection=None,
    )
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    await session.start(
        room=ctx.room,
        agent=AIChatAgent(),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC()
        ),
        room_output_options=RoomOutputOptions(audio_enabled=True),
    )

    # If the person greeted first, skip our greeting
    user_spoke_first = [False]  # use list so closure can mutate

    def _on_user_input_transcribed(_ev):
        user_spoke_first[0] = True

    session.on("user_input_transcribed", _on_user_input_transcribed)

    # Give the user a short window to say "Hi" first; if they do, skip our greeting
    await asyncio.sleep(1.5)
    if user_spoke_first[0]:
        logger.info("User spoke first, skipping greeting")
    else:
        # First line: generate when greeting has intro_generation_prompt, else use intro_phrase
        greeting = AGENT_CONFIG.get("greeting") or {}
        intro_phrase = greeting.get("intro_phrase") or AGENT_CONFIG.get("intro_phrase")
        prompt = greeting.get("intro_generation_prompt")
        if prompt:
            model = greeting.get("intro_generation_model") or os.getenv("LLM_MODEL", "Pi-3.1")
            temperature = greeting.get("gen_temperature", 0.9)
            base_url = os.getenv("LLM_BASE_URL", "http://localhost:11434/v1")
            generated = await generate_intro_phrase(prompt, base_url=base_url, model=model, temperature=temperature)
            if generated:
                await session.say(generated)
            elif intro_phrase:
                await session.say(intro_phrase)
        elif intro_phrase:
            await session.say(intro_phrase)

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
