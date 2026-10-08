import os
import re
import uuid
from pathlib import Path
from typing import Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and display total page count:
    'Page X of Y' along with a subtle header rule.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_header_footer(self, total_pages: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "OmniTask AI • Generated Deliverable")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 750, 558, 750)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)

        footer_text = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(558, 32, footer_text)
        self.drawString(54, 32, "Confidential & Verified by OmniTask Multi-Agent Swarm")
        self.restoreState()


def clean_markdown_for_reportlab(text: str) -> str:
    """
    Sanitizes markdown tags into ReportLab compatible XML tags.
    """
    # Escape XML entities first
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # Re-enable basic tags
    # Bold: **bold** or __bold__
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"__(.+?)__", r"<b>\1</b>", text)

    # Italics: *italic* or _italic_
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", text)
    text = re.sub(r"(?<!_)_(?!_)(.+?)(?<!_)_(?!_)", r"<i>\1</i>", text)

    # Inline code: `code`
    text = re.sub(r"`(.+?)`", r'<font face="Courier" color="#0f172a" backcolor="#f1f5f9"> \1 </font>', text)

    return text


def markdown_to_pdf(
    markdown_content: str,
    title: str = "OmniTask Document Deliverable",
    output_filename: Optional[str] = None,
    output_dir: Optional[Path] = None,
) -> Tuple[str, Path]:
    """
    Compiles markdown content into a publication-quality PDF document.
    Returns (pdf_url, physical_path).
    """
    if not output_dir:
        output_dir = Path(__file__).resolve().parent.parent.parent / "uploads" / "generated"
    output_dir.mkdir(parents=True, exist_ok=True)

    if not output_filename:
        safe_base = re.sub(r"[^a-zA-Z0-9_-]", "_", title.lower()).strip("_")[:40] or "document"
        unique_suffix = uuid.uuid4().hex[:8]
        output_filename = f"{safe_base}_{unique_suffix}.pdf"

    if not output_filename.endswith(".pdf"):
        output_filename += ".pdf"

    file_path = output_dir / output_filename

    # Build Document Template
    doc = SimpleDocTemplate(
        str(file_path),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=8,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=14,
    )

    h1_style = ParagraphStyle(
        "DocH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "DocH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#334155"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    h3_style = ParagraphStyle(
        "DocH3",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6,
    )

    bullet_style = ParagraphStyle(
        "DocBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        leftIndent=15,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=4,
    )

    code_style = ParagraphStyle(
        "DocCode",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
    )

    flowables = []

    # Title Banner
    flowables.append(Paragraph(title, title_style))
    flowables.append(Paragraph("Prepared by OmniTask AI Multi-Agent Engine • Verified Deliverable", subtitle_style))
    flowables.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#3b82f6"), spaceAfter=14))

    # Parse lines
    lines = markdown_content.split("\n")
    in_code_block = False
    code_lines = []
    code_block_lang = ""

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Check code fence
        if stripped.startswith("```"):
            if in_code_block:
                in_code_block = False
                is_md_block = code_block_lang in ["markdown", "md"] or any(l.strip().startswith(("#", "##", "- ", "* ", "1.")) for l in code_lines[:6])
                if is_md_block:
                    # Unpack markdown lines into the main stream to be rendered as styled headings and text
                    lines = lines[:i] + code_lines + lines[i+1:]
                    code_lines = []
                    continue

                if code_lines:
                    chunk_size = 15
                    rows = []
                    for k in range(0, len(code_lines), chunk_size):
                        chunk = code_lines[k:k+chunk_size]
                        chunk_text = "<br/>".join([
                            l.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;")
                            for l in chunk
                        ])
                        rows.append([Paragraph(chunk_text, code_style)])
                    
                    if rows:
                        t = Table(rows, colWidths=[504])
                        t.setStyle(TableStyle([
                            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                            ("TOPPADDING", (0, 0), (-1, -1), 3),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                            ("LEFTPADDING", (0, 0), (-1, -1), 8),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ]))
                        flowables.append(t)
                        flowables.append(Spacer(1, 6))
                code_lines = []
            else:
                code_block_lang = stripped[3:].strip().lower()
                in_code_block = True
                code_lines = []
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        stripped = line.strip()

        # Blank line
        if not stripped:
            flowables.append(Spacer(1, 4))
            i += 1
            continue

        # Horizontal rule
        if stripped in ["---", "***", "___"]:
            flowables.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=8, spaceBefore=8))
            i += 1
            continue

        # Headings
        if stripped.startswith("# "):
            clean_text = clean_markdown_for_reportlab(stripped[2:])
            flowables.append(Paragraph(clean_text, h1_style))
            i += 1
            continue
        elif stripped.startswith("## "):
            clean_text = clean_markdown_for_reportlab(stripped[3:])
            flowables.append(Paragraph(clean_text, h2_style))
            i += 1
            continue
        elif stripped.startswith("### "):
            clean_text = clean_markdown_for_reportlab(stripped[4:])
            flowables.append(Paragraph(clean_text, h3_style))
            i += 1
            continue

        # Bullet points
        if stripped.startswith(("- ", "* ", "+ ")):
            clean_text = clean_markdown_for_reportlab(stripped[2:])
            bullet_html = f"&bull;&nbsp;&nbsp;{clean_text}"
            flowables.append(Paragraph(bullet_html, bullet_style))
            i += 1
            continue

        # Numbered lists (e.g. "1. ", "2) ")
        num_match = re.match(r"^(\d+[\.\)])\s+(.*)$", stripped)
        if num_match:
            num_prefix = num_match.group(1)
            clean_text = clean_markdown_for_reportlab(num_match.group(2))
            item_html = f"<b>{num_prefix}</b>&nbsp;&nbsp;{clean_text}"
            flowables.append(Paragraph(item_html, bullet_style))
            i += 1
            continue

        # Standard paragraph
        clean_text = clean_markdown_for_reportlab(stripped)
        flowables.append(Paragraph(clean_text, body_style))
        i += 1

    # Build the PDF using NumberedCanvas
    doc.build(flowables, canvasmaker=NumberedCanvas)

    pdf_url = f"/api/generated-media/{output_filename}"
    return pdf_url, file_path
