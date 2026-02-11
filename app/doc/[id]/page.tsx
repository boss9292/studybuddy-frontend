"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import FlashcardList from "@/components/FlashcardList";
import MarkdownView from "@/components/MarkdownView";
import type { Card } from "@/lib/types";
import { exportCsvURL, exportApkgURL } from "@/lib/api";
import { marked } from "marked";
import DOMPurify from "dompurify";

type Row = {
  id: string;
  title: string;
  summary: string | null;
  cards_json: {
    cards: Card[];
  } | null;
};

/* ---- SAME pipeline helpers as the component (kept here so PDF matches) ---- */
function baseNormalize(input: string | undefined | null): string {
  if (!input) return "";
  let s = input;
  s = s.replace(/\uFEFF/g, "");
  s = s.replace(/[\u200B-\u200D\u2060]/g, "");
  s = s.replace(/[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g, " ");
  s = s.replace(/\r\n?/g, "\n");
  s = s.replace(
    /^[ \t\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]+(?=(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|\|))/gm,
    ""
  );
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
function autopromoteHeadings(s: string): string {
  if (HAS_HEADINGS_RE.test(s)) return s;
  const blocks = s.split(/\n{2,}/);
  const out: string[] = [];
  let didH1 = false;
  for (const b of blocks) {
    const t = b.trim();
    if (!t) continue;
    if (!didH1 && isCandidateHeading(t)) {
      out.push(`# ${t}`); didH1 = true;
    } else if (isCandidateHeading(t)) {
      out.push(`## ${t}`);
    } else {
      out.push(t);
    }
  }
  return out.join("\n\n").trim();
}
function bulletizeDefinitionLines(s: string): string {
  const defLine = /^(?![-*+]\s)(?!#{1,6}\s)(?!>)(?!\|)(?:\*\*[^*\n]+?\*\*)\s*:\s+.+$/gm;
  return s.replace(defLine, (m) => `- ${m}`);
}
function ensureComfortableSpacing(s: string): string {
  s = s.replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2");
  s = s.replace(/(#{1,6}\s[^\n]+)\n(?!\n)/g, "$1\n\n");
  s = s.replace(/([^\n])\n([-*+]\s|\d+\.\s)/g, "$1\n\n$2");
  s = s.replace(/((?:^|\n)(?:[-*+]\s|\d+\.\s).*(?:\n(?:[-*+]\s|\d+\.\s).*)*)\n([^\n-])/g, "$1\n\n$2");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
/* ------------------------------------------------------------------------- */

export default function DocDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<Row | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("documents")
        .select("id,title,summary,cards_json")
        .eq("id", id)
        .maybeSingle();
      if (!mounted) return;
      setRow((data as Row) || null);

      try {
        const parsed = data?.cards_json
          ? typeof data.cards_json === "string" ? JSON.parse(data.cards_json) : data.cards_json
          : { cards: [] };
        setCards(parsed.cards || []);
      } catch { setCards([]); }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  // Parsed + sanitized HTML with inline CSS for PDF
  const pdfHtml = useMemo(() => {
    const a = baseNormalize(row?.summary || "");
    const b = autopromoteHeadings(a);
    const c = bulletizeDefinitionLines(b);
    const src = ensureComfortableSpacing(c);

    marked.setOptions({ gfm: true, breaks: false });
    const raw = marked.parse(src) as string;
    const safe = DOMPurify.sanitize(raw);

    const css = `
      <style>
        :root { --ink:#0f172a; }
        body { color: var(--ink); font-family: Inter, Arial, sans-serif; }
        h1 { font-size: 2.5em; font-weight: 800; line-height: 1.1; margin: 1.2em 0 .7em; color: var(--ink);}
        h2 { font-size: 2em;   font-weight: 700; line-height: 1.15; margin: 1.4em 0 .8em; color: var(--ink);}
        h3 { font-size: 1.5em; font-weight: 700; margin: 1.1em 0 .6em; }
        p  { margin: .8em 0;   line-height: 1.65; font-size: 1.05rem; }
        ul,ol { margin: 1em 0; padding-left: 1.4em; }
        li { margin: .45em 0; line-height: 1.6; }
        strong { font-weight: 700; }
      </style>
    `;
    return css + safe;
  }, [row?.summary]);

  if (loading) return <section className="mx-auto max-w-5xl p-6">Loading…</section>;
  if (!row) return <section className="mx-auto max-w-5xl p-6">Not found.</section>;

  return (
    <section className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{row.title || "Untitled"}</h1>
        <div className="flex gap-2">
          <a href={exportCsvURL(row.id, row.title || "StudyBuddy")} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">CSV</a>
          <a href={exportApkgURL(row.id, row.title || "StudyBuddy")} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Anki</a>
        </div>
      </div>

      {row.summary && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">SUMMARY</div>
            <button
              type="button"
              className="rounded-md border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
              onClick={() => {
                const el = document.getElementById("pdf-summary");
                if (!el) return;
                import("html2pdf.js").then((html2pdf) => {
                  html2pdf.default()
                    .set({ margin: 0.5, filename: `${row.title || "summary"}.pdf`, html2canvas: { scale: 2 } })
                    .from(el)
                    .save();
                });
              }}
            >
              Export PDF
            </button>
          </div>

          {/* On-screen rendering (Markdown with bullets & headings) */}
          <MarkdownView content={row.summary} />

          {/* Hidden PDF container with the same rendering, plus inline CSS */}
          <div id="pdf-summary" style={{ display: "none" }}>
            <div
              style={{
                color: "#222",
                background: "#fff",
                fontFamily: "Inter, Arial, sans-serif",
                padding: "24px",
                maxWidth: "800px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
              dangerouslySetInnerHTML={{ __html: pdfHtml }}
            />
          </div>
        </div>
      )}

      {cards.length > 0 ? (
        <FlashcardList cards={cards} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-700">
          No flashcards found for this document.
        </div>
      )}
    </section>
  );
}
