"use client";

import { useState } from "react";
import { deleteDocument, deleteQuiz } from "@/lib/delete";

type Props =
  | { kind: "document"; id: string; title?: string; onDeleted?: () => void }
  | { kind: "quiz"; id: string; title?: string; onDeleted?: () => void };

export default function DeleteButton(props: Props) {
  const [busy, setBusy] = useState(false);
  const label =
    props.kind === "document" ? "Delete document" : "Delete quiz";

  async function onClick() {
    if (busy) return;
    const name = props.title ?? props.id;
    const ok = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!ok) return;
    try {
      setBusy(true);
      if (props.kind === "document") {
        await deleteDocument(props.id);
      } else {
        await deleteQuiz(props.id);
      }
      props.onDeleted?.();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="text-sm px-3 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
      title={label}
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
