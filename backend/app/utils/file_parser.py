import io
import os
from pathlib import Path
from typing import Tuple

def extract_text_from_file_bytes(filename: str, file_bytes: bytes) -> Tuple[str, str]:
    """
    Extracts readable text and determines content type from uploaded file bytes.
    Supports PDF (via pypdf), plain text, markdown, json, python, csv, etc.
    Returns (extracted_text, detected_content_type).
    """
    ext = Path(filename).suffix.lower()
    
    # 1. PDF Handling
    if ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            max_pages = min(len(reader.pages), 60)  # extract up to 60 pages
            for i in range(max_pages):
                page_text = reader.pages[i].extract_text() or ""
                if page_text.strip():
                    pages_text.append(f"--- [Page {i+1}] ---\n{page_text}")
            
            full_text = "\n\n".join(pages_text)
            if full_text.strip():
                return full_text, "application/pdf"
        except Exception as e:
            print(f"[FileParser] pypdf extraction error: {e}")

        # Fallback pure-python PDF string sweep
        try:
            import re
            matches = re.findall(rb'\((.*?)\)\s*(?:Tj|\'|\")', file_bytes)
            if matches:
                clean_strings = [m.decode("utf-8", errors="ignore") for m in matches if len(m) > 2]
                fallback_text = " ".join(clean_strings[:3000])
                if len(fallback_text) > 100:
                    return fallback_text, "application/pdf"
        except Exception:
            pass

    # 2. Text / Markdown / Code / JSON / CSV
    try:
        text = file_bytes.decode("utf-8")
        return text, "text/plain"
    except UnicodeDecodeError:
        pass

    try:
        text = file_bytes.decode("latin-1")
        return text, "text/plain"
    except Exception:
        pass

    return f"[Binary file: {filename}, size: {len(file_bytes)} bytes]", "application/octet-stream"
