"""
Dual-Channel Output Separation & Inter-Agent Handover Engine for OmniTask AI.
Cleanly separates user-facing deliverables from internal coordination, metadata,
and directives intended for downstream AI specialist agents.
"""
import re
import json
from typing import Tuple, Dict, Any, Optional

def extract_and_sanitize_handover(
    raw_output: str,
    primary_objective: str = "",
    domain: str = ""
) -> Tuple[str, Dict[str, Any]]:
    """
    Splits raw LLM output into:
    1. clean_user_deliverable: Pure, polished output meant for user display.
    2. internal_handover: Structured dictionary containing instructions, parameters,
       chosen entities, or metadata meant specifically for downstream AI agents on the Blackboard.
    """
    if not raw_output:
        return "", {}

    text = raw_output
    handover: Dict[str, Any] = {}

    # 1. Extract explicit <agent_handover>...</agent_handover> blocks
    handover_block_match = re.search(r"<agent_handover>([\s\S]*?)</agent_handover>", text, flags=re.IGNORECASE)
    if handover_block_match:
        content = handover_block_match.group(1).strip()
        try:
            # Attempt JSON parse
            parsed_json = json.loads(content)
            if isinstance(parsed_json, dict):
                handover.update(parsed_json)
        except Exception:
            # Fallback to key-value or raw directive extraction
            for line in content.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    handover[k.strip().lower().replace(" ", "_")] = v.strip()
                else:
                    handover.setdefault("directives", []).append(line.strip())
        # Strip the entire block from user deliverable
        text = re.sub(r"<agent_handover>[\s\S]*?</agent_handover>", "", text, flags=re.IGNORECASE)

    # 2. Extract <secret_answer>...</secret_answer> tags
    secret_match = re.search(r"<secret_answer>\s*(.*?)\s*</secret_answer>", text, flags=re.IGNORECASE)
    if secret_match:
        ans = secret_match.group(1).strip()
        handover["secret_answer"] = ans
        handover.setdefault("target_subject", ans)
        text = re.sub(r"<secret_answer>[\s\S]*?</secret_answer>", "", text, flags=re.IGNORECASE)

    # 3. Extract <!-- AGENT_HANDOVER: ... --> or <!-- INTERNAL_DIRECTIVE: ... --> comments
    comment_match = re.search(r"<!--\s*(?:AGENT_HANDOVER|INTERNAL_DIRECTIVE|DOWNSTREAM_INSTRUCTIONS):\s*([\s\S]*?)\s*-->", text, flags=re.IGNORECASE)
    if comment_match:
        comm_content = comment_match.group(1).strip()
        try:
            parsed_comm = json.loads(comm_content)
            if isinstance(parsed_comm, dict):
                handover.update(parsed_comm)
        except Exception:
            handover["comment_directive"] = comm_content
        text = re.sub(r"<!--\s*(?:AGENT_HANDOVER|INTERNAL_DIRECTIVE|DOWNSTREAM_INSTRUCTIONS):[\s\S]*?-->", "", text, flags=re.IGNORECASE)

    # 4. Extract parenthetical or conversational notes directed at other agents/tools
    # e.g. "(For the requested image of the object, please produce a picture of a pen.)"
    # e.g. "(Note to next agent: generate an image of ...)"
    # e.g. "(Instructions for step_2: render a ...)"
    leak_regexes = [
        # Image directives
        r"\n*\(\s*(?:For the (?:requested|next|downstream) (?:image|visual|asset)|Note (?:for|to) (?:the )?(?:image|visual|next) agent|Please produce (?:an?|the) (?:picture|image|photo) of)\s*[:\-]?\s*([^)\n]+)\)\s*$",
        # Multi-line variations
        r"\n*\(For the requested image[\s\S]*?\)\s*$",
        # Generic downstream agent instructions in parentheses
        r"\n*\(\s*(?:Note|Instructions?|Directive) (?:to|for) (?:the )?(?:next|downstream|subsequent) (?:agent|step|model)\s*[:\-]?\s*([^)\n]+)\)\s*$"
    ]

    for pat in leak_regexes:
        m = re.search(pat, text, flags=re.IGNORECASE)
        if m:
            matched_str = m.group(0)
            # Try to extract target subject if not already present
            if not handover.get("target_subject") and not handover.get("secret_answer"):
                subj_m = re.search(r"(?:picture of a|picture of an|picture of|produce a|produce an|image of a|image of an|render a|render an)\s+([a-zA-Z0-9\s_-]+?)(?:\.|\)|$)", matched_str, flags=re.IGNORECASE)
                if subj_m:
                    extracted_subj = subj_m.group(1).strip().rstrip(".)")
                    if extracted_subj:
                        handover["target_subject"] = extracted_subj
                        handover["secret_answer"] = extracted_subj
            handover["downstream_directive"] = matched_str.strip("()\n ")
            text = text[:m.start()] + text[m.end():]

    # 5. Handle Secrecy / Riddle / Guessing game constraints
    is_secrecy_requested = any(w in primary_objective.lower() for w in [
        "dont tell the answer", "don't tell the answer", "dont give the answer", "don't give the answer",
        "not tell the answer", "without telling the answer", "dont reveal the answer", "don't reveal the answer",
        "riddle", "guess", "spoiler", "secret"
    ])

    if is_secrecy_requested:
        # Strip trailing Answer/Solution reveals if leaked in text
        reveal_m = re.search(r"\n*(?:Answer|Solution|Secret Answer|The answer is)\s*[:\-]\s*([^\n]+)\s*$", text, flags=re.IGNORECASE)
        if reveal_m:
            if not handover.get("secret_answer"):
                handover["secret_answer"] = reveal_m.group(1).strip()
                handover.setdefault("target_subject", reveal_m.group(1).strip())
            text = text[:reveal_m.start()].strip()

    # Clean up whitespace
    clean_text = re.sub(r"\n{3,}", "\n\n", text).strip()

    return clean_text, handover
