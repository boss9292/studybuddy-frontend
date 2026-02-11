"use client";

import React, { useState } from "react";
import FileDrop from "@/components/FileDrop";
import FlashcardList from "@/components/FlashcardList";
import MarkdownView from "@/components/MarkdownView";
import type { Card } from "@/lib/types";
import { API_BASE } from "@/lib/env";
import { supabase } from "@/lib/supabase";

const exportCsvURL = (docId: string, title: string) =>
  `${API_BASE}/export/csv/${docId}?title=${encodeURIComponent(title)}`;
const exportApkgURL = (docId: string, title: string) =>
  `${API_BASE}/export/apkg/${docId}?title=${encodeURIComponent(title)}`;
const baseName = (filename: string) => filename.replace(/\.[^.]+$/, "");

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [wantSummary, setWantSummary] = useState(true);
  const [wantCards, setWantCards] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [docId, setDocId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [summary, setSummary] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [wordTarget, setWordTarget] = useState(3000);

  // null-safe
  const handleSelect = (f: File | null) => {
    if (!f) {
      setFile(null);
      setDocId(null);
      setTitle("");
      return;
    }
    setFile(f);
    setDocId(null);
    setTitle(baseName(f.name));
  };

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setStatus(""); setSummary(""); setCards([]); setDocId(null);

    if (!file) return setError("Please choose a PDF.");
    if (!wantSummary && !wantCards) return setError("Select at least one: Summary or Flashcards.");

    try {
      setLoading(true);
      setStatus("Uploading…");

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title || baseName(file.name));
      fd.append("make_summary", wantSummary ? "1" : "0");
      fd.append("make_cards", wantCards ? "1" : "0");
      fd.append("word_target", String(wordTarget));

      const resp = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Upload failed: ${resp.status} ${text}`);
      }

      const json = await resp.json();
      setStatus("Done.");
      setDocId(json.id);
      setTitle(json.title ?? (file ? baseName(file.name) : "Untitled"));
      if (wantSummary) setSummary((json.summary as string) || "");

      if (wantCards) {
        let parsed: Card[] = [];
        if (Array.isArray(json.cards)) parsed = json.cards as Card[];
        else if (json.cards && json.cards.cards) parsed = json.cards.cards as Card[];
        else if (json.cards_json) {
          try {
            const obj = JSON.parse(json.cards_json);
            if (obj && Array.isArray(obj.cards)) parsed = obj.cards as Card[];
          } catch {}
        }
        setCards(parsed);
      }
    } catch (err: any) {
      setError(err?.message ?? "Error generating content.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  const download = async (url: string, filename: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Upload PDF for Study Notes</h1>
        <p className="mt-2 text-slate-600">Generate long, readable notes with big headings and bold key terms, plus optional flashcards.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 sm:grid-cols-3">
          <form onSubmit={onGenerate} className="space-y-5 sm:col-span-2">
            <FileDrop onSelect={handleSelect} label={`API: ${API_BASE}`} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Document title (appears as big H1)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Comprehensive Guide to ..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Word target (more = more detail)</label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={wordTarget}
                  onChange={(e) => setWordTarget(parseInt(e.target.value, 10))}
                >
                  <option value={2200}>~2,200 words</option>
                  <option value={3000}>~3,000 words (recommended)</option>
                  <option value={4000}>~4,000 words</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={wantSummary} onChange={(e)=>setWantSummary(e.target.checked)} />
                Summary
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={wantCards} onChange={(e)=>setWantCards(e.target.checked)} />
                Flashcards
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                disabled={!file || loading}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-white font-medium shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Working…" : "Generate"}
              </button>

              {docId && cards.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => download(exportCsvURL(docId, title || (file ? baseName(file.name) : "notes")), "cards.csv")}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
                  >
                    Download CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => download(exportApkgURL(docId, title || (file ? baseName(file.name) : "notes")), "studybuddy.apkg")}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
                  >
                    Download Anki (.apkg)
                  </button>
                </>
              )}

              {file && <span className="text-sm text-slate-600">Selected: <strong>{file.name}</strong></span>}
              {status && <span className="text-sm text-slate-500">{status}</span>}
            </div>

            {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          </form>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-medium text-slate-800">Tips</div>
            <ul className="list-disc pl-5">
              <li>Use a descriptive title — it becomes the big top heading.</li>
              <li>Increase the word target for more depth.</li>
              <li>Uncheck anything you don’t need to save time and cost.</li>
            </ul>
          </div>
        </div>
      </div>

      {summary && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</div>
          <MarkdownView content={summary} />
        </div>
      )}

      {cards.length > 0 && <FlashcardList cards={cards} />}
    </section>
  );
}
