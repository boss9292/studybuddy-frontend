"use client";

import React, { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/* ---------- low-level cleanup (no spacing yet) ---------- */
function baseNormalize(input: string | undefined | null): string {
  if (!input) return "";
  let s = input;
  s = s.replace(/\uFEFF/g, "");                  // BOM
  s = s.replace(/[\u200B-\u200D\u2060]/g, "");   // zero-widths
  s = s.replace(/[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g, " "); // unicode spaces → space
  s = s.replace(/\r\n?/g, "\n");                 // newlines
  // tokens (#, -, 1., >, |) start at column 0
  s = s.replace(
    /^[ \t\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]+(?=(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|\|))/gm,
    ""
  );
  // remove orphan heading markers
  s = s.replace(/^\s*#{1,6}\s*$/gm, "");
  return s.trim();
}

const HAS_HEADINGS_RE = /^#{1,6}\s/m;
function isCandidateHeading(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (t.includes("\n")) return false;
  if (/^(?:[-*+]|>|\||\d+\.)\s/.test(t)) return false;
  if (/^```/.test(t)) return false;
  if (/[.!?]$/.test(t)) return false;
  if (t.length > 100) return false;
  return true;
}

/** If doc has no headings at all, promote first block to H1 and following heading-like single lines to H2. */
function autopromoteHeadings(s: string): string {
  if (HAS_HEADINGS_RE.test(s)) return s;
  const blocks = s.split(/\n{2,}/);
  const out: string[] = [];
  let didH1 = false;
  for (const b of blocks) {
    const t = b.trim();
    if (!t) continue;
    if (!didH1 && isCandidateHeading(t)) {
      out.push(`# ${t}`);
      didH1 = true;
    } else if (isCandidateHeading(t)) {
      out.push(`## ${t}`);
    } else {
      out.push(t);
    }
  }
  return out.join("\n\n").trim();
}

/** Turn lines like "**CPU Scheduling:** text" into "- **CPU Scheduling:** text" */
function bulletizeDefinitionLines(s: string): string {
  // skip lines already bullets / headings / quotes / tables
  const defLine = /^(?![-*+]\s)(?!#{1,6}\s)(?!>)(?!\|)(?:\*\*[^*\n]+?\*\*)\s*:\s+.+$/gm;
  return s.replace(defLine, (m) => `- ${m}`);
}

/** Add comfortable spacing around headings & lists (after bulletization). */
function ensureComfortableSpacing(s: string): string {
  s = s.replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2");             // blank before H1–H6
  s = s.replace(/(#{1,6}\s[^\n]+)\n(?!\n)/g, "$1\n\n");          // blank after H1–H6
  s = s.replace(/([^\n])\n([-*+]\s|\d+\.\s)/g, "$1\n\n$2");      // blank before list
  s = s.replace(/((?:^|\n)(?:[-*+]\s|\d+\.\s).*(?:\n(?:[-*+]\s|\d+\.\s).*)*)\n([^\n-])/g, "$1\n\n$2"); // after list
  s = s.replace(/\n{3,}/g, "\n\n");                               // collapse >2 newlines
  return s.trim();
}

type Props = { content: string };

export default function MarkdownView({ content }: Props) {
  const src = useMemo(() => {
    const a = baseNormalize(content);
    const b = autopromoteHeadings(a);
    const c = bulletizeDefinitionLines(b);
    return ensureComfortableSpacing(c);
  }, [content]);

  marked.setOptions({ gfm: true, breaks: false });

  const html = useMemo(() => {
    const raw = marked.parse(src) as string;
    return DOMPurify.sanitize(raw);
  }, [src]);

  return (
    <article
      className="
        prose prose-slate max-w-none
        prose-h1:text-4xl md:prose-h1:text-5xl prose-h1:font-extrabold prose-h1:leading-tight prose-h1:mb-6
        prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-5
        prose-h3:text-2xl md:prose-h3:text-3xl prose-h3:font-semibold prose-h3:mt-7 prose-h3:mb-3.5
        prose-p:my-4 prose-p:leading-relaxed prose-p:text-[1.05rem]
        prose-strong:font-semibold
        prose-ul:my-5 prose-ul:pl-6 prose-li:my-2 prose-li:leading-relaxed
        prose-ol:my-5 prose-ol:pl-6
        prose-a:text-indigo-600 hover:prose-a:underline
        text-slate-800
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
