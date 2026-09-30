from typing import List, Dict, Any
from app.models.schemas import ToolRecommendation, AdvisorResponse
from app.advisor.tools_catalog import AI_TOOLS_CATALOG

class AIAdvisorEngine:
    """
    Track 1: Free AI Advisor & Suggester.
    Deconstructs user queries and prescribes the exact industry-leading tools,
    models, prompt templates, and execution blueprints for DIY fulfillment.
    """
    def __init__(self):
        self.catalog = AI_TOOLS_CATALOG

    def advise(self, user_query: str) -> AdvisorResponse:
        q_lower = user_query.lower()
        decomposition: List[str] = []
        recommendations: List[ToolRecommendation] = []
        diy_blueprint: List[Dict[str, Any]] = []

        step_num = 1

        # Check for Research / Planning
        if any(w in q_lower for w in ["research", "find", "search", "investigate", "study", "paper", "data", "info", "analyze"]):
            decomposition.append("Step 1: Grounded Research & Fact Gathering")
            tool = self._find_tool("perplexity-pro")
            recommendations.append(ToolRecommendation(
                category="Research & Discovery",
                tool_name=tool["name"],
                provider=tool["provider"],
                description=tool["description"],
                why_recommended="Gathers real-time web sources with inline citations, avoiding hallucinated data.",
                sample_prompt=f"Research the most up-to-date methodologies for: {user_query}. Provide specific citations.",
                is_free=tool["is_free"],
                pricing_tier=tool["pricing_tier"]
            ))
            diy_blueprint.append({
                "step": step_num,
                "action": "Conduct Grounded Fact Gathering",
                "recommended_tool": tool["name"],
                "instruction": "Run the sample prompt, export citations to markdown, and filter out low-confidence sources."
            })
            step_num += 1

        # Check for Math / Quantitative
        if any(w in q_lower for w in ["math", "calculate", "equation", "numerical", "finance", "revenue", "roi", "statistics"]):
            decomposition.append(f"Step {step_num}: Mathematical Modeling & Proofs")
            tool = self._find_tool("deepseek-r1")
            recommendations.append(ToolRecommendation(
                category="Quantitative Analysis",
                tool_name=tool["name"],
                provider=tool["provider"],
                description=tool["description"],
                why_recommended="Unmatched open reasoning capabilities for formal math and algorithmic proofs.",
                sample_prompt=f"Derive the exact mathematical formulas, variables, and numerical constraints for: {user_query}.",
                is_free=tool["is_free"],
                pricing_tier=tool["pricing_tier"]
            ))
            diy_blueprint.append({
                "step": step_num,
                "action": "Derive Mathematical Bounds",
                "recommended_tool": tool["name"],
                "instruction": "Request chain-of-thought derivations and lock the resulting constants."
            })
            step_num += 1

        # Check for Coding / Engineering
        if any(w in q_lower for w in ["code", "python", "script", "program", "app", "website", "api", "software", "develop"]):
            decomposition.append(f"Step {step_num}: Software Engineering & Code Generation")
            tool = self._find_tool("claude-3-5-sonnet")
            recommendations.append(ToolRecommendation(
                category="Software Engineering",
                tool_name=tool["name"],
                provider=tool["provider"],
                description=tool["description"],
                why_recommended="Industry-standard benchmark for zero-defect fullstack coding and API structure.",
                sample_prompt=f"Write a modular, typed Python 3.12 architecture to implement: {user_query}.",
                is_free=tool["is_free"],
                pricing_tier=tool["pricing_tier"]
            ))
            diy_blueprint.append({
                "step": step_num,
                "action": "Implement Code Architecture",
                "recommended_tool": tool["name"],
                "instruction": "Paste the mathematical outputs into Claude 3.5 Sonnet and prompt for modular code with tests."
            })
            step_num += 1

        # Check for Visual / Image
        if any(w in q_lower for w in ["image", "picture", "infographic", "visual", "logo", "photo", "render", "diagram"]):
            decomposition.append(f"Step {step_num}: Visual Asset Synthesis")
            tool = self._find_tool("flux-1-schnell")
            recommendations.append(ToolRecommendation(
                category="Visual Synthesis",
                tool_name=tool["name"],
                provider=tool["provider"],
                description=tool["description"],
                why_recommended="State-of-the-art text rendering in images, open-weights, and fast generation.",
                sample_prompt=f"High-resolution 16:9 modern technical infographic explaining: {user_query}, cyan and dark slate theme, clean typography.",
                is_free=tool["is_free"],
                pricing_tier=tool["pricing_tier"]
            ))
            diy_blueprint.append({
                "step": step_num,
                "action": "Generate Visual Assets",
                "recommended_tool": tool["name"],
                "instruction": "Use Flux.1 or Midjourney with precise aspect ratio flags (--ar 16:9)."
            })
            step_num += 1

        # Check for Voice / Video
        if any(w in q_lower for w in ["voice", "audio", "podcast", "speech"]):
            decomposition.append(f"Step {step_num}: Voice & Audio Synthesis")
            tool = self._find_tool("elevenlabs")
            recommendations.append(ToolRecommendation(
                category="Voice Synthesis",
                tool_name=tool["name"],
                provider=tool["provider"],
                description=tool["description"],
                why_recommended="Hyper-realistic human cadence and emotion control.",
                sample_prompt=f"Narrate the following summary in an engaging, articulate tone: [Paste Summary]",
                is_free=tool["is_free"],
                pricing_tier=tool["pricing_tier"]
            ))
            diy_blueprint.append({
                "step": step_num,
                "action": "Synthesize Voiceover",
                "recommended_tool": tool["name"],
                "instruction": "Select a clear narrator voice and adjust stability to 65% for natural cadence."
            })
            step_num += 1

        # If generic or no specific matched:
        if not recommendations:
            decomposition = [
                "Step 1: Deep Strategic Research & Brainstorming",
                "Step 2: Synthesis & Deliverable Generation"
            ]
            t1 = self._find_tool("gemini-2-0-flash-deep-research")
            t2 = self._find_tool("claude-3-5-sonnet")
            recommendations = [
                ToolRecommendation(
                    category="High-Context Research",
                    tool_name=t1["name"],
                    provider=t1["provider"],
                    description=t1["description"],
                    why_recommended="Can ingest entire books, codebases, or complex documents at once without losing details.",
                    sample_prompt=f"Provide a comprehensive, end-to-end breakdown of: {user_query}",
                    is_free=t1["is_free"],
                    pricing_tier=t1["pricing_tier"]
                ),
                ToolRecommendation(
                    category="Synthesis & Execution",
                    tool_name=t2["name"],
                    provider=t2["provider"],
                    description=t2["description"],
                    why_recommended="Best-in-class for executing multi-step instructions and structuring final deliverables.",
                    sample_prompt=f"Synthesize the findings into an actionable executive report for: {user_query}",
                    is_free=t2["is_free"],
                    pricing_tier=t2["pricing_tier"]
                )
            ]
            diy_blueprint = [
                {"step": 1, "action": "Deep Analysis", "recommended_tool": t1["name"], "instruction": "Feed full context into Gemini."},
                {"step": 2, "action": "Refine & Finalize", "recommended_tool": t2["name"], "instruction": "Format final deliverable in Claude."}
            ]

        return AdvisorResponse(
            original_query=user_query,
            task_decomposition=decomposition,
            recommendations=recommendations,
            diy_execution_blueprint=diy_blueprint
        )

    def _find_tool(self, tool_id: str) -> Dict[str, Any]:
        for t in self.catalog:
            if t["id"] == tool_id:
                return t
        return self.catalog[0]
