import io
import os
import re
import base64
import httpx
from pathlib import Path
from typing import Tuple
try:
    from app.config import config
except ImportError:
    from backend.app.config import config

def extract_text_from_file_bytes(filename: str, file_bytes: bytes) -> Tuple[str, str]:
    """
    Extracts readable text and determines content type from uploaded file bytes.
    Supports:
    - Images (.jpg, .jpeg, .png, .webp, .bmp) via Multimodal Gemini Vision OCR
    - Word Documents (.docx, .doc) via python-docx
    - PDF (.pdf) via pypdf
    - Plain text, markdown, json, python, csv, etc.
    Returns (extracted_text, detected_content_type).
    """
    ext = Path(filename).suffix.lower()
    
    # 1. Image Files -> Multimodal Gemini Vision OCR Transcription
    if ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"]:
        mime_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
            ".gif": "image/gif"
        }
        image_mime = mime_map.get(ext, "image/jpeg")

        if config.GEMINI_API_KEY:
            try:
                img_b64 = base64.b64encode(file_bytes).decode("utf-8")
                candidate_models = ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
                ocr_prompt = (
                    "You are an expert document and syllabus OCR extraction assistant.\n"
                    "Exhaustively transcribe all visible text, tables, units, topics, course codes, course titles, "
                    "objectives, outcomes, and instructions from this image.\n"
                    "Preserve the exact titles, headers, bullet points, and table structures faithfully in markdown format.\n"
                    "Do NOT summarize, omit, or abbreviate any portion of the document. Output the complete extracted text directly."
                )

                for model_name in candidate_models:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={config.GEMINI_API_KEY}"
                    payload = {
                        "contents": [{
                            "parts": [
                                {"text": ocr_prompt},
                                {"inline_data": {"mime_type": image_mime, "data": img_b64}}
                            ]
                        }]
                    }
                    try:
                        resp = httpx.post(url, json=payload, timeout=45.0)
                        if resp.status_code == 200:
                            data = resp.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts and "text" in parts[0]:
                                    extracted_text = parts[0]["text"].strip()
                                    if len(extracted_text) > 20:
                                        return extracted_text, image_mime
                    except Exception as model_err:
                        print(f"[FileParser] Error calling {model_name} for image OCR: {model_err}")
            except Exception as ocr_err:
                print(f"[FileParser] Gemini Vision OCR failed on {filename}: {ocr_err}")

        return f"[Image document uploaded: '{filename}', size: {len(file_bytes)} bytes. Image visual data ready for multimodal processing.]", image_mime

    # 2. Word Documents (.docx)
    if ext == ".docx":
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            doc_lines = []
            for p in doc.paragraphs:
                p_text = p.text.strip()
                if p_text:
                    doc_lines.append(p_text)
            for table in doc.tables:
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        doc_lines.append(" | ".join(row_cells))
            full_text = "\n\n".join(doc_lines)
            if full_text.strip():
                return full_text, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        except Exception as docx_err:
            print(f"[FileParser] python-docx extraction error: {docx_err}")

    # 3. PDF Handling
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
            matches = re.findall(rb'\((.*?)\)\s*(?:Tj|\'|\")', file_bytes)
            if matches:
                clean_strings = [m.decode("utf-8", errors="ignore") for m in matches if len(m) > 2]
                fallback_text = " ".join(clean_strings[:3000])
                if len(fallback_text) > 100:
                    return fallback_text, "application/pdf"
        except Exception:
            pass

    # 4. Text / Markdown / Code / JSON / CSV
    try:
        text = file_bytes.decode("utf-8")
        return text, "text/plain"
    except UnicodeDecodeError:
        pass

    return f"[Binary file: {filename}, size: {len(file_bytes)} bytes]", "application/octet-stream"
