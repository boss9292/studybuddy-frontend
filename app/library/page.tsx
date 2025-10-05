"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

type Doc = {
  id: string;
  title: string;
  summary?: string | null;
  created_at: string;
};

type Quiz = {
  id: string;
  doc_id: string;
  title: string;
  num_questions?: number | null;
  created_at: string;
};

type Status = "idle" | "loading" | "ready" | "error";

export default function LibraryPage() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setStatus("loading");
    setErr(null);
    try {
      const [{ data: d, error: de }, { data: q, error: qe }] = await Promise.all([
        supabase.from("documents").select("id,title,summary,created_at").order("created_at", { ascending: false }),
        supabase.from("quizzes").select("id,doc_id,title,num_questions,created_at").order("created_at", { ascending: false }),
      ]);
      if (de) throw de;
      if (qe) throw qe;
      setDocs(d || []);
      setQuizzes(q || []);
      setStatus("ready");
    } catch (e: any) {
      setErr(e?.message || "Failed to load library");
      setStatus("error");
    }
  }, [supabase]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await fetchAll();
    })();
    return () => {
      alive = false;
    };
  }, [fetchAll]);

  const refreshing = status === "loading";

  function fmt(ts: string) {
    try { return new Date(ts).toLocaleString(); } catch { return ts; }
  }

  // Download via your existing backend signer: /api/documents/[id]/download?mode=download
  const getDocUrl = async (id: string, mode: "download" | "inline" = "download") => {
    const res = await fetch(`/api/documents/${id}/download?mode=${mode}`, { method: "GET", cache: "no-store" });
    if (!res.ok) {
      let msg = "Failed to get file URL";
      try { const j = await res.json(); msg = j?.error || msg; } catch {}
      throw new Error(msg);
    }
    const json = (await res.json()) as { url: string };
    return json.url;
  };

  const handleDocDownload = async (id: string) => {
    try {
      const url = await getDocUrl(id, "download");
      window.location.href = url;
    } catch (e: any) {
      alert(e?.message || "Failed to download PDF");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Library</h1>
        <button
          onClick={fetchAll}
          disabled={refreshing}
          className="text-sm px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {status === "loading" && <div className="mt-2 text-xs text-slate-500">Loading…</div>}
      {status === "error" && (
        <div className="mt-2 text-sm text-red-600 border border-red-200 bg-red-50 rounded p-3">{err}</div>
      )}

      {/* Documents */}
      <section className="mt-6 mb-10">
        <h2 className="text-xl font-medium mb-3">Documents</h2>

        {docs.length === 0 && status === "ready" ? (
          <div className="text-sm text-slate-500">No documents yet.</div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docs.map((doc) => (
              <li key={doc.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{doc.title || "Untitled"}</div>
                    <div className="text-xs text-slate-500">Created: {fmt(doc.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/doc/${doc.id}`}
                      className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
                      title="Open document"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => handleDocDownload(doc.id)}
                      className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
                      title="Download PDF"
                    >
                      Download PDF
                    </button>
                    <DeleteButton kind="document" id={doc.id} title={doc.title} onDeleted={fetchAll} />
                  </div>
                </div>
                {/* optional summary */}
                {/* {!!doc.summary && <p className="text-sm text-slate-700 mt-3 line-clamp-3">{doc.summary}</p>} */}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quizzes */}
      <section>
        <h2 className="text-xl font-medium mb-3">Quizzes</h2>
        {quizzes.length === 0 && status === "ready" ? (
          <div className="text-sm text-slate-500">No quizzes yet.</div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((q) => (
              <li key={q.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{q.title || "Untitled"}</div>
                    <div className="text-xs text-slate-500">
                      Questions: {q.num_questions ?? "—"} · Created: {fmt(q.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/quiz/${q.id}`}
                      className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
                      title="Open quiz"
                    >
                      Open
                    </Link>
                    <DeleteButton kind="quiz" id={q.id} title={q.title} onDeleted={fetchAll} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
