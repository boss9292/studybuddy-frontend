"use client";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="font-semibold">StudyBuddy</Link>
        <nav className="flex items-center gap-4 text-sm text-slate-700">
          <Link href="/upload" className="hover:underline">Upload</Link>
          <Link href="/quiz" className="hover:underline">Quiz</Link>
          <Link href="/library" className="hover:underline">Library</Link>
        </nav>
        <div className="ml-auto">
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
