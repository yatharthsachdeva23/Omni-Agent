import json
import httpx
from typing import List, Dict, Any, Optional
from app.models.schemas import ToolRecommendation, AdvisorResponse
from app.advisor.tools_catalog import AI_TOOLS_CATALOG
from app.config import config

class AIAdvisorEngine:
    """
    Track 1: Free AI Advisor & Suggester.
    Deeply analyzes user requests using live LLM reasoning (Google Gemini & Jev System 1)
    to deconstruct goals, select optimal benchmark tools from the catalog,
    and generate custom production-grade prompt templates and DIY execution blueprints.
    """
    def __init__(self):
        self.catalog = AI_TOOLS_CATALOG
        self.gemini_key = config.GEMINI_API_KEY
        self.groq_key = config.GROQ_API_KEY
        self.beat_key = config.BEAT_API_KEY

        # Build a compact text representation of the tools catalog for prompt context
        self.catalog_context = "\n".join([
            f"- [{t['name']}] (Provider: {t['provider']} | Category: {t['category']} | Free: {t['is_free']} | Tier: {t['pricing_tier']}): {t['description']} Strengths: {', '.join(t.get('strengths', []))}"
            for t in self.catalog
        ])

    async def advise_async(self, user_query: str) -> AdvisorResponse:
        """
        Primary LLM-powered advisory engine.
        Uses live Gemini 3.5 Flash / Groq to understand nuanced requirements and prescribe tools.
        """
        # 1. Try Gemini 3.5 Flash Lite (First choice: fast, intelligent, structured JSON)
        if self.gemini_key:
            try:
                gemini_resp = await self._call_gemini_advisor(user_query)
                if gemini_resp:
                    return gemini_resp
            except Exception as e:
                print(f"[AI Advisor] Gemini call error: {e}. Attempting Groq fallback.")

        # 2. Try Groq Cloud (Secondary LLM fallback: sub-second inference)
        if self.groq_key:
            try:
                groq_resp = await self._call_groq_advisor(user_query)
                if groq_resp:
                    return groq_resp
            except Exception as e:
                print(f"[AI Advisor] Groq call error: {e}. Falling back to baseline recommender.")

        # 3. Deterministic Safety Fallback (Guarantees zero-failure if all APIs are offline)
        return self._deterministic_fallback(user_query)

    def advise(self, user_query: str) -> AdvisorResponse:
        """
        Synchronous wrapper for backwards compatibility.
        """
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If running within an active event loop, run in a separate task or thread
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    return executor.submit(asyncio.run, self.advise_async(user_query)).result()
            else:
                return loop.run_until_complete(self.advise_async(user_query))
        except Exception:
            return self._deterministic_fallback(user_query)

    async def _call_gemini_advisor(self, user_query: str) -> Optional[AdvisorResponse]:
        """
        Calls Google Gemini using structured JSON mode to analyze the user's objective.
        """
        prompt = (
            f"You are the AI Advisor for Omni Agent.\n"
            f"Analyze this complex user goal deeply:\n"
            f"\"{user_query}\"\n\n"
            f"Break this goal down into logical milestones and prescribe 2 to 4 of the most suitable tools from the catalog below.\n"
            f"Write highly specific, custom copy-pasteable prompts tailored to the user's goal, and explain the technical rationale.\n\n"
            f"AVAILABLE AI TOOLS CATALOG:\n{self.catalog_context}\n\n"
            f"Output must be a strictly valid JSON object matching this schema:\n"
            f"{{\n"
            f'  "task_decomposition": ["Step 1: ...", "Step 2: ..."],\n'
            f'  "recommendations": [\n'
            f'    {{\n'
            f'      "category": "Domain Category",\n'
            f'      "tool_name": "Tool Name from Catalog",\n'
            f'      "provider": "Provider Name",\n'
            f'      "description": "Short tool summary",\n'
            f'      "why_recommended": "Specific technical reason why this tool is ideal for this user objective",\n'
            f'      "sample_prompt": "Tailored, production-ready copy-pasteable prompt for this user goal",\n'
            f'      "is_free": true,\n'
            f'      "pricing_tier": "Free / Freemium / Paid"\n'
            f'    }}\n'
            f'  ],\n'
            f'  "diy_execution_blueprint": [\n'
            f'    {{\n'
            f'      "step": 1,\n'
            f'      "action": "Milestone action description",\n'
            f'      "recommended_tool": "Tool name",\n'
            f'      "instruction": "Step-by-step guidance on how to run this tool and pass its output downstream"\n'
            f'    }}\n'
            f'  ]\n'
            f"}}"
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(raw_text)

                # Handle case where LLM returns a list with single dict
                if isinstance(parsed, list) and len(parsed) > 0:
                    parsed = parsed[0]

                return self._parse_to_advisor_response(user_query, parsed)
        return None

    async def _call_groq_advisor(self, user_query: str) -> Optional[AdvisorResponse]:
        """
        Calls Groq Cloud (llama-3.3-70b-versatile or qwen-2.5-coder-32b) with JSON mode.
        """
        system_prompt = (
            "You are the AI Advisor for Omni Agent.\n"
            "Analyze the user's objective, choose optimal tools from the catalog, and generate custom DIY prompt templates.\n"
            f"AVAILABLE TOOLS CATALOG:\n{self.catalog_context}\n\n"
            "Output ONLY valid JSON with keys: 'task_decomposition' (list of strings), 'recommendations' (list of recommendation objects), and 'diy_execution_blueprint' (list of blueprint objects)."
        )

        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"User Goal: {user_query}"}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return self._parse_to_advisor_response(user_query, parsed)
        return None

    def _parse_to_advisor_response(self, user_query: str, parsed: Dict[str, Any]) -> AdvisorResponse:
        """
        Validates and parses JSON dict into strongly-typed AdvisorResponse.
        """
        decomposition = parsed.get("task_decomposition", [])
        if not isinstance(decomposition, list):
            decomposition = [str(decomposition)]

        raw_recs = parsed.get("recommendations", [])
        recommendations: List[ToolRecommendation] = []
        for r in raw_recs:
            if isinstance(r, dict):
                # Ensure is_free is boolean
                is_free_val = r.get("is_free", False)
                if isinstance(is_free_val, str):
                    is_free_val = is_free_val.lower() in ["true", "1", "yes", "free"]

                recommendations.append(ToolRecommendation(
                    category=r.get("category", "General AI"),
                    tool_name=r.get("tool_name", "AI Tool"),
                    provider=r.get("provider", "External AI"),
                    description=r.get("description", ""),
                    why_recommended=r.get("why_recommended", "High-performance fit for this milestone."),
                    sample_prompt=r.get("sample_prompt", f"Assist me with: {user_query}"),
                    is_free=bool(is_free_val),
                    pricing_tier=r.get("pricing_tier", "Freemium")
                ))

        blueprints = parsed.get("diy_execution_blueprint", [])
        formatted_blueprints: List[Dict[str, Any]] = []
        for idx, b in enumerate(blueprints):
            if isinstance(b, dict):
                formatted_blueprints.append({
                    "step": b.get("step", idx + 1),
                    "action": b.get("action", f"Milestone {idx + 1}"),
                    "recommended_tool": b.get("recommended_tool", "AI Model"),
                    "instruction": b.get("instruction", "Execute the prompt and synthesize results.")
                })

        return AdvisorResponse(
            original_query=user_query,
            task_decomposition=decomposition,
            recommendations=recommendations,
            diy_execution_blueprint=formatted_blueprints
        )

    def _deterministic_fallback(self, user_query: str) -> AdvisorResponse:
        """
        Safety net fallback when offline or if all API calls fail.
        """
        q_lower = user_query.lower()
        decomposition: List[str] = [
            "Step 1: Grounded Research & Specification Discovery",
            "Step 2: Core Engineering & Implementation",
            "Step 3: Verification & Polish"
        ]
        t1 = self.catalog[10]  # Gemini 2.0 Flash
        t2 = self.catalog[0]   # Claude 3.5 Sonnet
        
        recommendations = [
            ToolRecommendation(
                category="High-Context Research",
                tool_name=t1["name"],
                provider=t1["provider"],
                description=t1["description"],
                why_recommended="Ingests complex multi-domain documentation with high context retention.",
                sample_prompt=f"Analyze requirements, dependencies, and architecture for: {user_query}",
                is_free=t1["is_free"],
                pricing_tier=t1["pricing_tier"]
            ),
            ToolRecommendation(
                category="Engineering & Execution",
                tool_name=t2["name"],
                provider=t2["provider"],
                description=t2["description"],
                why_recommended="Industry benchmark for zero-defect fullstack coding and technical execution.",
                sample_prompt=f"Implement a modular, production-ready solution for: {user_query}",
                is_free=t2["is_free"],
                pricing_tier=t2["pricing_tier"]
            )
        ]
        diy_blueprint = [
            {"step": 1, "action": "Deep Analysis", "recommended_tool": t1["name"], "instruction": "Feed full context into Gemini to map dependencies."},
            {"step": 2, "action": "Execute Implementation", "recommended_tool": t2["name"], "instruction": "Paste the specifications into Claude 3.5 Sonnet to generate the deliverables."}
        ]

        return AdvisorResponse(
            original_query=user_query,
            task_decomposition=decomposition,
            recommendations=recommendations,
            diy_execution_blueprint=diy_blueprint
        )
