import json
import re
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
            "You are the AI Advisor for OmniTask AI.\n"
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

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={self.gemini_key}"
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
        Calls Groq Cloud with JSON mode and explicit schema.
        """
        system_prompt = (
            "You are the Lead AI Architecture Advisor for OmniTask AI.\n"
            "Analyze the user's objective, break it down into milestones, choose the 2 to 4 optimal tools from the catalog, and generate custom DIY prompt templates.\n"
            f"AVAILABLE TOOLS CATALOG:\n{self.catalog_context}\n\n"
            "You MUST output strictly valid JSON matching this schema:\n"
            "{\n"
            '  "task_decomposition": ["Step 1: ...", "Step 2: ..."],\n'
            '  "recommendations": [\n'
            "    {\n"
            '      "tool_name": "Exact Tool Name from catalog",\n'
            '      "category": "Domain Category",\n'
            '      "provider": "Provider Name",\n'
            '      "description": "Short description of tool",\n'
            '      "why_recommended": "Specific technical justification for why this tool is chosen for this objective",\n'
            '      "sample_prompt": "Production-ready, copy-pasteable prompt tailored for this tool and objective",\n'
            '      "is_free": true,\n'
            '      "pricing_tier": "Free / Freemium / Paid"\n'
            "    }\n"
            "  ],\n"
            '  "diy_execution_blueprint": [\n'
            "    {\n"
            '      "step": 1,\n'
            '      "action": "Concrete descriptive milestone title",\n'
            '      "recommended_tool": "Tool Name",\n'
            '      "instruction": "Detailed technical execution guidance for this milestone",\n'
            '      "expected_output": "Concrete expected deliverable file or artifact"\n'
            "    }\n"
            "  ]\n"
            "}"
        )

        async with httpx.AsyncClient(timeout=14.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "openai/gpt-oss-120b",
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
        Validates, enriches, and parses JSON dict into strongly-typed AdvisorResponse.
        Resilient against schema variations and enriches from the tool catalog.
        """
        decomposition = parsed.get("task_decomposition", [])
        if not isinstance(decomposition, list):
            decomposition = [str(decomposition)]
        if not decomposition:
            decomposition = [
                f"Step 1: Architecture Formulation for '{user_query[:50]}'",
                "Step 2: Core Asset & Logic Implementation",
                "Step 3: Verification & Packaging"
            ]

        # Helper to find tool in catalog
        def find_in_catalog(t_name: str) -> Optional[Dict[str, Any]]:
            if not t_name:
                return None
            norm = t_name.lower().replace("-", " ").replace("_", " ")
            for item in self.catalog:
                i_name = item.get("name", "").lower()
                if i_name in norm or norm in i_name:
                    return item
            return None

        raw_recs = parsed.get("recommendations", [])
        recommendations: List[ToolRecommendation] = []
        for idx, r in enumerate(raw_recs):
            if isinstance(r, dict):
                # Flexible extraction
                t_name = r.get("tool_name") or r.get("tool") or r.get("name") or r.get("model") or "Specialized AI Tool"
                cat = r.get("category") or r.get("domain") or r.get("type") or "General AI"
                prov = r.get("provider") or r.get("company") or r.get("vendor") or "Independent"
                desc = r.get("description") or r.get("summary") or r.get("overview") or ""
                why_rec = r.get("why_recommended") or r.get("purpose") or r.get("reason") or r.get("why") or f"Top-tier performance and suitability for {user_query}."
                prompt = r.get("sample_prompt") or r.get("prompt") or r.get("prompt_template") or r.get("template")

                is_free_val = r.get("is_free", False)
                if isinstance(is_free_val, str):
                    is_free_val = is_free_val.lower() in ["true", "1", "yes", "free"]
                pricing = r.get("pricing_tier", "Freemium")

                # Catalog enrichment
                cat_match = find_in_catalog(t_name)
                if cat_match:
                    if prov in ["External AI", "Independent", ""]:
                        prov = cat_match.get("provider", prov)
                    if not desc:
                        desc = cat_match.get("description", "")
                    if cat in ["General AI", ""]:
                        cat = cat_match.get("category", cat)
                    if "is_free" not in r:
                        is_free_val = cat_match.get("is_free", is_free_val)
                    if "pricing_tier" not in r:
                        pricing = cat_match.get("pricing_tier", pricing)

                if not prompt or prompt.startswith("Assist me with:"):
                    prompt = (
                        f"Act as a principal specialist in {cat}. My goal is: {user_query}.\n"
                        f"Using {t_name}, execute this milestone with production-grade precision, "
                        f"providing full configuration, implementation code, and architectural guidelines."
                    )

                recommendations.append(ToolRecommendation(
                    category=cat,
                    tool_name=t_name,
                    provider=prov,
                    description=desc,
                    why_recommended=why_rec,
                    sample_prompt=prompt,
                    is_free=bool(is_free_val),
                    pricing_tier=pricing
                ))

        # If recommendations were empty, fallback to catalog
        if not recommendations:
            return self._deterministic_fallback(user_query)

        blueprints = parsed.get("diy_execution_blueprint", [])
        formatted_blueprints: List[Dict[str, Any]] = []
        for idx, b in enumerate(blueprints):
            if isinstance(b, dict):
                step_val = b.get("step", idx + 1)
                try:
                    step_num = int(step_val)
                except Exception:
                    step_num = idx + 1

                action = b.get("action") or b.get("title") or b.get("milestone")
                if not action and isinstance(step_val, str) and not step_val.strip().isdigit():
                    action = step_val.strip()
                if not action:
                    action = f"Milestone {step_num}: System Implementation"

                rec_tool = b.get("recommended_tool") or b.get("tool") or b.get("model") or b.get("tool_name")
                if not rec_tool or rec_tool == "AI Model":
                    rec_tool = recommendations[min(idx, len(recommendations) - 1)].tool_name

                actions_list = b.get("actions")
                if isinstance(actions_list, list) and actions_list:
                    instruction = " ".join([str(a) for a in actions_list])
                else:
                    instruction = b.get("instruction") or b.get("guidance") or b.get("description") or f"Deploy {rec_tool} to complete {action} according to system architecture."

                expected = b.get("expected_output") or b.get("deliverable") or b.get("output") or f"Verified {action} artifact & implementation specification"

                formatted_blueprints.append({
                    "step": step_num,
                    "action": action,
                    "recommended_tool": rec_tool,
                    "instruction": instruction,
                    "expected_output": expected
                })

        return AdvisorResponse(
            original_query=user_query,
            task_decomposition=decomposition,
            recommendations=recommendations,
            diy_execution_blueprint=formatted_blueprints
        )

    def _deterministic_fallback(self, user_query: str) -> AdvisorResponse:
        """
        Dynamic semantic fallback when offline or if all API calls fail.
        Ranks all tools in the catalog against the user query keywords,
        avoiding hardcoded indices.
        """
        q_words = set(re.findall(r'\b[a-zA-Z0-9_-]+\b', user_query.lower()))

        # Score catalog tools against query keywords
        scored_tools = []
        for t in self.catalog:
            score = 0
            text_corpus = f"{t.get('name', '')} {t.get('category', '')} {t.get('description', '')} {' '.join(t.get('strengths', []))}".lower()
            for w in q_words:
                if len(w) > 2 and w in text_corpus:
                    score += 2
                    if w in t.get('category', '').lower():
                        score += 3
                    if w in t.get('name', '').lower():
                        score += 4
            scored_tools.append((score, t))

        # Sort by score descending
        scored_tools.sort(key=lambda x: x[0], reverse=True)
        top_candidates = [t for s, t in scored_tools[:3] if s > 0]
        if not top_candidates:
            # Fallback to general high-performance pair if no keyword overlap
            top_candidates = [self.catalog[0], self.catalog[min(10, len(self.catalog) - 1)]]

        recommendations: List[ToolRecommendation] = []
        diy_blueprint: List[Dict[str, Any]] = []
        decomposition: List[str] = [
            f"Step 1: Problem Formulation & Architecture Definition for '{user_query[:40]}...'",
            f"Step 2: Core Implementation with Specialized Tooling",
            f"Step 3: Verification, Edge-Case Auditing & Delivery"
        ]

        for idx, tool in enumerate(top_candidates):
            category = tool.get("category", "General AI")
            name = tool.get("name", "AI Tool")
            provider = tool.get("provider", "External AI")
            desc = tool.get("description", "")
            is_free = tool.get("is_free", False)
            pricing = tool.get("pricing_tier", "Freemium")

            why_rec = f"Specialized {category} engine with top benchmark scores in {', '.join(tool.get('strengths', ['accuracy', 'speed']))}."
            sample_p = f"Execute step {idx + 1} for: {user_query}. Ensure modular output and rigorous constraint validation."

            recommendations.append(ToolRecommendation(
                category=category,
                tool_name=name,
                provider=provider,
                description=desc,
                why_recommended=why_rec,
                sample_prompt=sample_p,
                is_free=is_free,
                pricing_tier=pricing
            ))

            diy_blueprint.append({
                "step": idx + 1,
                "action": f"Deploy {name} for {category}",
                "recommended_tool": name,
                "instruction": f"Run the tailored prompt in {name} ({provider}) and pipe the output to downstream steps."
            })

        return AdvisorResponse(
            original_query=user_query,
            task_decomposition=decomposition,
            recommendations=recommendations,
            diy_execution_blueprint=diy_blueprint
        )
