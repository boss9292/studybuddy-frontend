"use client";

import Link from "next/link";
import Image from "next/image";
import AuthGate from "@/components/AuthGate";

export default function Nav() {
  return (
    // full-width bar; spacing handled with padding only
    <div className="w-full px-7 py-3 flex items-center gap-4">
      {/* Left: logo + brand, pinned to far-left */}
      <Link href="/" className="flex items-center gap-0 shrink-0">
        <Image
          src="/studybuddy-mark.png"
          alt="StudyBuddy logo"
          width={40}
          height={28}
          priority
          className="rounded-md"
        />
        <span className="text-slate-900 font-semibold">StudyBuddy</span>
      </Link>

      {/* Middle: primary nav (optional) */}
      <nav className="hidden sm:flex items-center gap-4 text-sm text-slate-700">
        <Link href="/upload" className="hover:underline">Upload</Link>
        <Link href="/quiz" className="hover:underline">Quiz</Link>
        <Link href="/library" className="hover:underline">Library</Link>
      </nav>

      {/* Right: auth button pinned to far-right */}
      <div className="ml-auto">
        <AuthGate />
      </div>
    </div>
  );
}
