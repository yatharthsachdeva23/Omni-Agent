import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class AppConfig:
    # 1. Jev System 1 Routing (via BeatAPI)
    BEAT_API_KEY: str = os.getenv("BEAT_API_KEY", "").strip()
    BEAT_API_SYSTEMONE_URL: str = os.getenv("BEAT_API_SYSTEMONE_URL", "https://api.beatapi.io/v1/systemone").strip()
    JEV_MODEL: str = os.getenv("JEV_MODEL", "jev-1.13-free").strip()

    # 2. Vercel Platform Token
    VERCEL_API_KEY: str = os.getenv("VERCEL_API_KEY", "").strip()

    # 3. Google Gemini 2.0 Flash (Reviewer & Summarizer)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()

    # 4. Groq Cloud (Qwen 2.5 Coder)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()

    # 5. OpenRouter (Mistral Legal/Logic & OpenAI GPT Models)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "").strip()

    # 6. Ollama Cloud
    OLLAMA_API_KEY: str = os.getenv("OLLAMA_API_KEY", "").strip()

    # 7. Audio & Music Generation (Meta MusicGen via Hugging Face & Suno AI)
    HF_TOKEN: str = os.getenv("HF_TOKEN", os.getenv("HUGGINGFACE_API_KEY", "")).strip()
    SUNO_API_KEY: str = os.getenv("SUNO_API_KEY", "").strip()

    # 8. Video Generation (Kling AI & CogVideoX)
    KLING_ACCESS_KEY: str = os.getenv("KLING_ACCESS_KEY", "").strip()
    KLING_SECRET_KEY: str = os.getenv("KLING_SECRET_KEY", "").strip()
    ZHIPU_API_KEY: str = os.getenv("ZHIPU_API_KEY", "").strip()

    @classmethod
    def get_status(cls):
        return {
            "jev_router_connected": bool(cls.BEAT_API_KEY),
            "gemini_reviewer_connected": bool(cls.GEMINI_API_KEY),
            "qwen_coder_groq_connected": bool(cls.GROQ_API_KEY),
            "openrouter_connected": bool(cls.OPENROUTER_API_KEY),
            "vercel_connected": bool(cls.VERCEL_API_KEY),
            "ollama_connected": bool(cls.OLLAMA_API_KEY),
            "flux1_visual_connected": True,
            "musicgen_connected": bool(cls.HF_TOKEN),
            "suno_connected": bool(cls.SUNO_API_KEY),
            "kling_connected": bool(cls.KLING_ACCESS_KEY and cls.KLING_SECRET_KEY),
            "cogvideox_connected": bool(cls.HF_TOKEN or cls.ZHIPU_API_KEY)
        }

config = AppConfig()
