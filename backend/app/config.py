import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class AppConfig:
    # 1. Jev Router (Vercel API / TypeSafe AI)
    VERCEL_JEV_API_KEY: str = os.getenv("VERCEL_JEV_API_KEY", "").strip()
    VERCEL_AI_GATEWAY_URL: str = os.getenv("VERCEL_AI_GATEWAY_URL", "https://api.typesafe.ai/v1/jev").strip()

    # 2. Gemini Reviewer & Summarizer (Google AI Studio)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()

    # 3. Coding Specialist: Qwen 2.5 Coder (Groq Cloud)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()

    # 4. Legal & Logic Specialist (Mistral AI)
    MISTRAL_API_KEY: str = os.getenv("MISTRAL_API_KEY", "").strip()

    # 5. Auditing Specialist (OpenAI GPT)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()

    @classmethod
    def get_status(cls):
        return {
            "jev_router_connected": bool(cls.VERCEL_JEV_API_KEY),
            "gemini_reviewer_connected": bool(cls.GEMINI_API_KEY),
            "qwen_coder_groq_connected": bool(cls.GROQ_API_KEY),
            "mistral_legal_connected": bool(cls.MISTRAL_API_KEY),
            "openai_audit_connected": bool(cls.OPENAI_API_KEY),
            "flux1_visual_connected": True  # Pollinations API requires no key (free & open)
        }

config = AppConfig()
