"use client";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";

export default function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setEmail(s?.user?.email ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setMsg("");
    // Works once Google provider is enabled in Supabase
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const signInEmail = async () => {
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) setMsg(error.message);
  };

  const signUpEmail = async () => {
    setMsg("");
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (error) setMsg(error.message);
    else setMsg("Check your email to confirm.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (email) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">{email}</span>
        <button
          onClick={signOut}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={signInWithGoogle}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        title="Sign in with Google (enable provider in Supabase first)"
      >
        Google
      </button>

      <div className="flex items-center gap-1">
        <input
          type="email"
          placeholder="email"
          className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          type="password"
          placeholder="password"
          className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        <button
          onClick={signInEmail}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
        >
          Sign in
        </button>
        <button
          onClick={signUpEmail}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
        >
          Sign up
        </button>
      </div>

      {msg && <span className="text-xs text-red-600">{msg}</span>}
    </div>
  );
}
