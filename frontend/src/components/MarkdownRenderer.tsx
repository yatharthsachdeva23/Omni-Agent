import React, { useMemo } from 'react';
import { marked } from 'marked';
import katex from 'katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    const mathPlaceholders: string[] = [];

    // Step 1: Extract LaTeX environments like \begin{align}...\end{align}, \begin{matrix}...\end{matrix}
    let text = content.replace(
      /\\begin\{(equation\*?|align\*?|gather\*?|matrix|pmatrix|bmatrix|vmatrix|cases)\}([\s\S]*?)\\end\{\1\}/g,
      (match) => {
        const idx = mathPlaceholders.length;
        try {
          const html = katex.renderToString(match.trim(), {
            displayMode: true,
            throwOnError: false,
          });
          mathPlaceholders.push(html);
        } catch {
          mathPlaceholders.push(`<div class="text-rose-400 font-mono text-xs my-2">${match}</div>`);
        }
        return `@@@MATH_BLOCK_${idx}@@@`;
      }
    );

    // Step 2: Extract block math: \[ ... \] or $$ ... $$
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => {
      const idx = mathPlaceholders.length;
      try {
        const html = katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
        });
        mathPlaceholders.push(html);
      } catch {
        mathPlaceholders.push(`<div class="text-rose-400 font-mono text-xs my-2">${formula}</div>`);
      }
      return `@@@MATH_BLOCK_${idx}@@@`;
    });

    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => {
      const idx = mathPlaceholders.length;
      try {
        const html = katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
        });
        mathPlaceholders.push(html);
      } catch {
        mathPlaceholders.push(`<div class="text-rose-400 font-mono text-xs my-2">${formula}</div>`);
      }
      return `@@@MATH_BLOCK_${idx}@@@`;
    });

    // Step 3: Extract inline math: \( ... \)
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => {
      const idx = mathPlaceholders.length;
      try {
        const html = katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false,
        });
        mathPlaceholders.push(html);
      } catch {
        mathPlaceholders.push(`<span class="text-rose-400 font-mono text-xs">${formula}</span>`);
      }
      return `@@@MATH_INLINE_${idx}@@@`;
    });

    // Step 4: Extract single dollar inline math: $ ... $
    // Avoid double-dollar, newlines inside inline math, and currency (e.g. $100, $5.99)
    text = text.replace(/(?<!\$)\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\$)/g, (match, formula) => {
      // 1. Skip plain numbers or currency values
      if (/^\s*\$?\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:k|m|b|million|billion|trillion|usd|eur|gbp|inr|cents?|dollars?))?\s*$/i.test(formula)) {
        return match;
      }
      // 2. If it contains words with spaces but NO math operators / backslashes / symbols, it's likely prose between two dollar signs
      if (/\s/.test(formula) && !/[\\_{}^=+\-*/<>~|()[\]]/.test(formula)) {
        return match;
      }

      const idx = mathPlaceholders.length;
      try {
        const html = katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false,
        });
        mathPlaceholders.push(html);
        return `@@@MATH_INLINE_${idx}@@@`;
      } catch {
        return match;
      }
    });

    // Step 5: Run marked parser for Markdown formatting (bold, headings, lists, tables, code blocks)
    let html = '';
    try {
      html = marked.parse(text, {
        breaks: true,
        gfm: true,
      }) as string;
    } catch {
      html = `<p>${text}</p>`;
    }

    // Step 5b: Ensure all links open in a separate tab and do not hijack the app window
    html = html.replace(/<a\s+(href="[^"]*")/gi, (match, hrefPart) => {
      const isFile = /\.(pdf|docx|doc|zip|mp4|wav|mp3|png|jpg|jpeg)(?:\?|$)/i.test(hrefPart) || hrefPart.includes('/api/generated-');
      const downloadAttr = isFile ? 'download' : '';
      return `<a target="_blank" rel="noopener noreferrer" ${downloadAttr} class="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 font-medium cursor-pointer transition" ${hrefPart}`;
    });

    // Step 6: Restore block math placeholders (cleanly replace any surrounding <p> tags)
    html = html.replace(/<p>\s*@@@MATH_BLOCK_(\d+)@@@\s*<\/p>/g, (_, id) => {
      const mathHtml = mathPlaceholders[Number(id)] || '';
      return `<div class="my-4 py-3 px-4 rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-x-auto text-center flex items-center justify-center">${mathHtml}</div>`;
    });

    html = html.replace(/@@@MATH_BLOCK_(\d+)@@@/g, (_, id) => {
      const mathHtml = mathPlaceholders[Number(id)] || '';
      return `<div class="my-4 py-3 px-4 rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-x-auto text-center flex items-center justify-center">${mathHtml}</div>`;
    });

    // Step 7: Restore inline math placeholders
    html = html.replace(/@@@MATH_INLINE_(\d+)@@@/g, (_, id) => {
      return mathPlaceholders[Number(id)] || '';
    });

    return html;
  }, [content]);

  // Click interceptor: Guarantees links in markdown never hijack or navigate away from the current application state
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('a');
    if (!target) return;
    const href = target.getAttribute('href');
    if (!href) return;

    e.preventDefault();
    e.stopPropagation();

    const isDocx = /\.docx(?:\?|$)/i.test(href);
    if (isDocx) {
      // Trigger background download for Word files
      const a = document.createElement('a');
      a.href = href;
      a.download = href.split('/').pop()?.split('?')[0] || 'document.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Open PDF, media, or web URLs in a separate new tab
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`markdown-body text-sm text-neutral-200 leading-relaxed font-sans space-y-3 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
