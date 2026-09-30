from typing import List, Dict, Any

AI_TOOLS_CATALOG: List[Dict[str, Any]] = [
    # Coding & Development
    {
        "id": "claude-3-5-sonnet",
        "name": "Claude 3.5 Sonnet",
        "provider": "Anthropic",
        "category": "Coding & Architecture",
        "description": "Benchmark-leading model for software engineering, full-stack refactoring, and complex logic.",
        "strengths": ["Zero-shot code generation", "Context comprehension", "Architectural cleanliness"],
        "is_free": False,
        "pricing_tier": "Freemium ($20/mo Pro)"
    },
    {
        "id": "cursor-editor",
        "name": "Cursor AI IDE",
        "provider": "Anysphere",
        "category": "Coding & Architecture",
        "description": "AI-first code editor with deep codebase-wide semantic indexing and multi-file editing.",
        "strengths": ["Codebase navigation", "Inline diff edits", "Terminal integration"],
        "is_free": False,
        "pricing_tier": "Freemium (Free tier available)"
    },
    {
        "id": "openai-o3-mini",
        "name": "OpenAI o3-mini",
        "provider": "OpenAI",
        "category": "Coding & Reasoning",
        "description": "High-speed reasoning model tailored for complex algorithms and competitive programming.",
        "strengths": ["Algorithmic proofs", "Edge-case debugging", "Low latency"],
        "is_free": False,
        "pricing_tier": "API / Plus ($20/mo)"
    },

    # Math & Formal Reasoning
    {
        "id": "deepseek-r1",
        "name": "DeepSeek-R1",
        "provider": "DeepSeek",
        "category": "Mathematics & Reasoning",
        "description": "Open-weights reasoning model with state-of-the-art chain-of-thought performance in math.",
        "strengths": ["Olympiad-level math", "Symbolic derivations", "Cost-efficiency"],
        "is_free": True,
        "pricing_tier": "Free / Open-Source & Cheap API"
    },
    {
        "id": "wolfram-alpha",
        "name": "Wolfram Alpha",
        "provider": "Wolfram",
        "category": "Mathematics & Computation",
        "description": "Computational knowledge engine with exact symbolic math solvers and scientific datasets.",
        "strengths": ["Exact analytical solutions", "Calculus & linear algebra", "Scientific formulas"],
        "is_free": True,
        "pricing_tier": "Freemium (Free basic)"
    },

    # Image & Visual Design
    {
        "id": "midjourney-v6",
        "name": "Midjourney v6.1",
        "provider": "Midjourney Inc.",
        "category": "Image Generation",
        "description": "Industry benchmark for artistic visuals, photorealism, and stylistic control.",
        "strengths": ["Aesthetics", "Lighting realism", "Prompt nuance"],
        "is_free": False,
        "pricing_tier": "Paid (Starts $10/mo)"
    },
    {
        "id": "flux-1-schnell",
        "name": "Flux.1 Schnell",
        "provider": "Black Forest Labs",
        "category": "Image Generation",
        "description": "Ultra-fast open visual generator with incredible prompt adherence and text rendering.",
        "strengths": ["Readable text in images", "Open weights", "Sub-second inference"],
        "is_free": True,
        "pricing_tier": "Free / Open-Source"
    },
    {
        "id": "ideogram-v2",
        "name": "Ideogram 2.0",
        "provider": "Ideogram",
        "category": "Image Generation & Typography",
        "description": "Specialist in graphic design, typography, posters, and logo generation.",
        "strengths": ["Flawless typography", "Graphic design composition", "Branding assets"],
        "is_free": True,
        "pricing_tier": "Freemium (Daily free credits)"
    },

    # Video & Motion
    {
        "id": "runway-gen3",
        "name": "Runway Gen-3 Alpha",
        "provider": "RunwayML",
        "category": "Video Generation",
        "description": "Pioneering cinematic video generation model with fine camera and motion brush controls.",
        "strengths": ["Photoreal video", "Camera motion control", "Director mode"],
        "is_free": False,
        "pricing_tier": "Freemium (Free trial credits)"
    },
    {
        "id": "kling-ai",
        "name": "Kling AI",
        "provider": "Kuaishou",
        "category": "Video Generation",
        "description": "High-durability motion simulation with realistic physical dynamics.",
        "strengths": ["Long clips (up to 2 minutes)", "Physical accuracy", "Smooth motion"],
        "is_free": True,
        "pricing_tier": "Freemium (Daily free credits)"
    },

    # Research, Audit & High-Context Summarization
    {
        "id": "gemini-2-0-flash-deep-research",
        "name": "Gemini 2.0 Flash / Pro",
        "provider": "Google DeepMind",
        "category": "Research & High-Context",
        "description": "Multimodal engine with 2,000,000 token context window and native video/audio understanding.",
        "strengths": ["Massive document ingests", "Native multimodality", "Extremely fast"],
        "is_free": True,
        "pricing_tier": "Freemium (Free tier in Google AI Studio)"
    },
    {
        "id": "perplexity-pro",
        "name": "Perplexity AI",
        "provider": "Perplexity",
        "category": "Research & Web Synthesis",
        "description": "Conversational search engine with real-time web citations and structured summaries.",
        "strengths": ["Live web citations", "Fact verification", "Academic paper search"],
        "is_free": True,
        "pricing_tier": "Freemium (Free basic search)"
    },
    {
        "id": "notebooklm",
        "name": "NotebookLM",
        "provider": "Google",
        "category": "Research & Document Synthesis",
        "description": "Grounded AI notebook that synthesizes notes, PDFs, and generates audio discussions.",
        "strengths": ["Zero hallucination grounding", "Audio overview podcasts", "PDF synthesis"],
        "is_free": True,
        "pricing_tier": "Free"
    },

    # Audio & Voice
    {
        "id": "elevenlabs",
        "name": "ElevenLabs",
        "provider": "ElevenLabs",
        "category": "Voice & Audio",
        "description": "Hyper-realistic voice synthesis, emotional nuance, and voice cloning.",
        "strengths": ["Human-like cadence", "Multilingual", "Sound effects synthesis"],
        "is_free": True,
        "pricing_tier": "Freemium (Free monthly credits)"
    }
]
