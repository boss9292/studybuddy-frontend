"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import FlashcardList from "@/components/FlashcardList";
import type { Card } from "@/lib/types";
import { exportCsvURL, exportApkgURL } from "@/lib/api";

type Row = { id: string; title: string; summary: string | null; cards_json: any };

export default function DocDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<Row | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("documents")
        .select("id,title,summary,cards_json")
        .eq("id", id)
        .maybeSingle();
      if (!mounted) return;
      setRow((data as Row) || null);

      try {
        const parsed = data?.cards_json ? (typeof data.cards_json === "string" ? JSON.parse(data.cards_json) : data.cards_json) : { cards: [] };
        setCards(parsed.cards || []);
      } catch {
        setCards([]);
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <section className="mx-auto max-w-5xl p-6">Loading…</section>;
  }
  if (!row) {
    return <section className="mx-auto max-w-5xl p-6">Not found.</section>;
  }

  return (
    <section className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{row.title || "Untitled"}</h1>
        <div className="flex gap-2">
          <a href={exportCsvURL(row.id, row.title || "StudyBuddy")} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">CSV</a>
          <a href={exportApkgURL(row.id, row.title || "StudyBuddy")} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Anki</a>
        </div>
      </div>

      {row.summary && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</div>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{row.summary}</p>
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
