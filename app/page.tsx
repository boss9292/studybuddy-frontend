export default function HomePage() {
  return (
    <section className="grid gap-12">
      {/* HERO */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-600 to-blue-600 p-[1px] shadow">
        <div className="rounded-2xl bg-white">
          <div className="grid gap-6 p-8 sm:grid-cols-2 sm:gap-10 sm:p-12">
            <div className="space-y-5">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                Turn slides into <span className="text-indigo-600">study power</span>.
              </h1>
              <p className="text-slate-600">
                Upload your lecture slides and get instant summaries, high-yield flashcards, and quick quizzes with
                explanations. Cram mode included.
              </p>
              <div className="flex gap-3">
                <a
                  href="/upload"
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-white shadow hover:bg-indigo-500"
                >
                  Try it free
                </a>
                <a
                  href="/upload"
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-700 hover:bg-slate-100"
                >
                  Upload slides
                </a>
              </div>
            </div>

            {/* Mock preview card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-medium text-slate-700">Preview</div>
              <div className="grid gap-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs uppercase text-slate-500">Summary</div>
                  <p className="mt-1 text-sm text-slate-700">
                    Key concepts, definitions, and formulas distilled for rapid review.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs uppercase text-slate-500">Flashcards</div>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    <li>“What is latency?” → “Delay before data transfer begins.”</li>
                    <li>
                      Cloze: “TCP handshake is{" "}
                      <code className="rounded bg-slate-100 px-1 py-0.5">
                        {"{{c1::SYN}}, {{c2::SYN-ACK}}, {{c3::ACK}}"}
                      </code>
                      .”
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs uppercase text-slate-500">Quiz</div>
                  <p className="mt-1 text-sm text-slate-700">20 MCQs with rationales. Learn by testing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { t: "One-click", d: "Upload PDF and go. No prompt engineering." },
          { t: "Cram Mode", d: "Top-50 concepts prioritized for exam day." },
          { t: "Spaced repetition", d: "Retain more with smart review scheduling." },
        ].map((x) => (
          <div key={x.t} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-base font-semibold">{x.t}</div>
            <div className="mt-1 text-sm text-slate-600">{x.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}