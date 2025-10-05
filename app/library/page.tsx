"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { exportCsvURL, exportApkgURL } from "@/lib/api";

type DocRow = { id: string; title: string; created_at: string | null };
type QuizRow = { id: string; title: string; created_at: string | null };

export default function LibraryPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [tab, setTab] = useState<"docs" | "quizzes">("docs");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      setEmail(user?.email ?? null);
      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: d }, { data: q }] = await Promise.all([
        supabase
          .from("documents")
          .select("id,title,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("quizzes")
          .select("id,title,created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (!mounted) return;
      setDocs((d ?? []) as DocRow[]);
      setQuizzes((q ?? []) as QuizRow[]);
      setLoading(false);
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!email) {
    return (
      <section className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold">My Library</h1>
        <p className="mt-2 text-slate-700">Sign in to view your saved documents and quizzes.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Library</h1>
        <div className="text-sm text-slate-600">{email}</div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("docs")}
          className={`rounded-md px-3 py-1.5 text-sm ${tab === "docs" ? "bg-slate-900 text-white" : "border border-slate-300 hover:bg-slate-50"}`}
        >
          Documents
        </button>
        <button
          onClick={() => setTab("quizzes")}
          className={`rounded-md px-3 py-1.5 text-sm ${tab === "quizzes" ? "bg-slate-900 text-white" : "border border-slate-300 hover:bg-slate-50"}`}
        >
          Quizzes
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          Loading…
        </div>
      ) : tab === "docs" ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 w-40">Created</th>
                <th className="px-4 py-3 w-56">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 && (
                <tr>
                  <td className="px-4 py-5 text-slate-600" colSpan={3}>
                    No documents yet. Upload a PDF on the <span className="font-medium">Upload</span> page.
                  </td>
                </tr>
              )}
              {docs.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-3">{d.title || "Untitled"}</td>
                  <td className="px-4 py-3">{d.created_at ? new Date(d.created_at).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push(`/doc/${encodeURIComponent(d.id)}`)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                      >
                        Open
                      </button>
                      <a
                        href={exportCsvURL(d.id, d.title || "StudyBuddy")}
                        className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                      >
                        CSV
                      </a>
                      <a
                        href={exportApkgURL(d.id, d.title || "StudyBuddy")}
                        className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                      >
                        Anki
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 w-40">Created</th>
                <th className="px-4 py-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.length === 0 && (
                <tr>
                  <td className="px-4 py-5 text-slate-600" colSpan={3}>
                    No quizzes yet. Create one on the <span className="font-medium">Quiz</span> page.
                  </td>
                </tr>
              )}
              {quizzes.map((q) => (
                <tr key={q.id} className="border-t">
                  <td className="px-4 py-3">{q.title || "Untitled"}</td>
                  <td className="px-4 py-3">{q.created_at ? new Date(q.created_at).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/quiz/${encodeURIComponent(q.id)}`)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
