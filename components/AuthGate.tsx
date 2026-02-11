"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

/** Match GoTrue's "already registered" variants */
function isAlreadyRegisteredErr(err: any) {
  const msg = (err?.message || "").toLowerCase();
  const code = (err?.code || "").toLowerCase();
  const status = String(err?.status ?? "");
  return (
    msg.includes("already registered") ||
    msg.includes("already been registered") ||
    msg.includes("already exists") ||
    msg.includes("email exists") ||
    code === "user_already_exists" ||
    code === "email_exists" ||
    code === "email_address_already_exists" ||
    status === "422"
  );
}

function normalizeAuthError(err: any): string {
  const msg = (err?.message || "").toLowerCase();
  if (isAlreadyRegisteredErr(err)) {
    return "This email is already registered. Please sign in (or continue with Google if you used it before).";
  }
  if (msg.includes("invalid login credentials")) {
    return "Invalid email or password. Try again or use Google if you registered with it.";
  }
  if (msg.includes("rate limit")) {
    return "Too many attempts. Please try again in a minute.";
  }
  return err?.message || "Authentication failed. Please try again.";
}

export default function AuthGate() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [authed, setAuthed] = useState(false);

  const [open, setOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => alive && setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    if (typeof window !== "undefined") window.location.reload();
  }

  async function signInGoogle() {
    setBusy(true);
    setError(null);
    setInfo(null);
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/upload` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setError(normalizeAuthError(error));
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      if (isRegister) {
        const redirectTo =
          typeof window !== "undefined" ? `${window.location.origin}/upload` : undefined;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });

        if (error) {
          // 1) explicit "already registered"
          if (isAlreadyRegisteredErr(error)) {
            setIsRegister(false);
            setError(
              "This email is already registered. Please sign in (or continue with Google if you used it before)."
            );
            setBusy(false);
            return;
          }
          throw error;
        }

        // 2) Supabase nuance: success but user.identities = [] → already exists
        const identities = (data?.user as any)?.identities ?? [];
        if (Array.isArray(identities) && identities.length === 0) {
          setIsRegister(false);
          setError(
            "This email is already registered. Please sign in (or continue with Google if you used it before)."
          );
          setBusy(false);
          return;
        }

        // New account but email confirmation required
        if (!data.session) {
          setInfo("Check your email to confirm your account, then sign in.");
          setBusy(false);
          return;
        }

        // Auto-signed in (no confirmation needed)
        setOpen(false);
        if (typeof window !== "undefined") window.location.replace("/upload");
        return;
      }

      // Sign in
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(normalizeAuthError(error));
        setBusy(false);
        return;
      }

      setOpen(false);
      if (typeof window !== "undefined") window.location.replace("/upload");
    } catch (err: any) {
      setError(normalizeAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!authed ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
        >
          Sign in
        </button>
      ) : (
        <button
          onClick={signOut}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? "…" : "Sign out"}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[420px] max-w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-xl font-semibold">
              {isRegister ? "Create an account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isRegister ? "Sign up to get started" : "Sign in to continue"}
            </p>

            {!isRegister && (
              <button
                onClick={signInGoogle}
                disabled={busy}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path d="M12 10.2v3.6h5.1c-.22 1.3-.92 2.4-1.97 3.15l3.19 2.48C20.5 17.9 21.5 15.2 21.5 12c0-.9-.1-1.8-.3-2.6H12z" fill="#4285F4"/>
                  <path d="M6.54 13.79a5.99 5.99 0 010-3.58L3.17 7.58a9.01 9.01 0 000 8.84l3.37-2.63z" fill="#FBBC05"/>
                  <path d="M12 21c2.43 0 4.47-.8 5.96-2.17l-3.19-2.48c-.88.6-2.01.96-2.77.96-2.13 0-3.94-1.44-4.58-3.38l-3.4 2.64C5.51 19.98 8.55 21 12 21z" fill="#34A853"/>
                  <path d="M12 3c1.49 0 2.84.51 3.9 1.52l2.93-2.93C16.46.98 14.42 0 12 0 8.55 0 5.51 2.02 4.02 5.02l3.4 2.64C8.06 5.72 9.87 4.28 12 4.28z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            )}

            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs uppercase tracking-wider text-slate-400">or with email</span>
              <div className="h-px flex-1 bg-slate-20" />
            </div>

            {info && (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {info}
              </div>
            )}
            {error && (
              <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-3 space-y-3">
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-4 ring-blue-500/20"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-4 ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? (isRegister ? "Creating…" : "Signing in…") : isRegister ? "Sign up" : "Sign in"}
              </button>
            </form>

            <div className="mt-3 text-center text-sm">
              {isRegister ? (
                <>Already have an account?{" "}
                  <button
                    onClick={() => { setIsRegister(false); setError(null); setInfo(null); }}
                    className="text-blue-600 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>Don’t have an account?{" "}
                  <button
                    onClick={() => { setIsRegister(true); setError(null); setInfo(null); }}
                    className="text-blue-600 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
