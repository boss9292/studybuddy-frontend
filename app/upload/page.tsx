"use client";

import React, { useState } from "react";
import FileDrop from "@/components/FileDrop";
import FlashcardList from "@/components/FlashcardList";
import { uploadSlides, exportCsvURL, exportApkgURL } from "@/lib/api";
import type { Card } from "@/lib/types";
import { API_BASE } from "@/lib/env";
import { supabase } from "@/lib/supabase";

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

      const res = await uploadSlides({
        file,
        title: file.name,
        makeSummary: wantSummary,
        makeCards: wantCards,
      }, token);

      setStatus("Done.");
      setDocId(res.id);
      setTitle(file.name);
      if (wantSummary) setSummary(res.summary);
      if (wantCards) setCards(res.cards);
      setStatus("");
    } catch (err: any) {
      setError(err?.message ?? "Error generating content.");
    } finally {
      setLoading(false);
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
    <section className="grid gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload slides</h1>
        <p className="mt-1 text-slate-600">Choose what to generate to save time/cost.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 sm:grid-cols-3">
          <form onSubmit={onGenerate} className="space-y-4 sm:col-span-2">
            <FileDrop onSelect={(f) => { setFile(f); setDocId(null); }} label={`API: ${API_BASE}`} />

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
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Working…" : "Generate"}
              </button>

              {docId && cards.length > 0 && (
                <>
                  <button type="button" onClick={() => download(exportCsvURL(docId, title), "cards.csv")}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
                    Download CSV
                  </button>
                  <button type="button" onClick={() => download(exportApkgURL(docId, title), "studybuddy.apkg")}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
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
              <li>Uncheck what you don’t need to cut time & cost.</li>
              <li>Exports use your cached result—re-uploads are instant.</li>
              <li>If you hit rate limits, lower CONCURRENCY in backend `.env`.</li>
            </ul>
          </div>
        </div>
      </div>

      {summary && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</div>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{summary}</p>
        </div>
      )}

      {cards.length > 0 && <FlashcardList cards={cards} />}
    </section>
  );
}
