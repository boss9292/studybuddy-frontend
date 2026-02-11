import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Nav from "../components/Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyBuddy",
  description: "Upload slides → instant summary, flashcards, quizzes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50 text-slate-900 antialiased`}>
        {/* NAVBAR */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
  <Nav />
</header>

        {/* PAGE CONTENT */}
        <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-4 py-10">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="border-t border-slate-200 bg-white/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-slate-500">
            <span>© {new Date().getFullYear()} StudyBuddy</span>
            <span className="hidden sm:block">Built with Next.js + Tailwind</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
