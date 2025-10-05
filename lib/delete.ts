// Minimal client-side helpers to call delete endpoints.
// Reads the Supabase access token from localStorage.

const API = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const key = Object.keys(localStorage).find(
    (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
  );
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  const token = getToken();
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${API}/library/documents/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Delete failed");
  }
  return true;
}

export async function deleteQuiz(id: string): Promise<boolean> {
  const token = getToken();
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${API}/library/quizzes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Delete failed");
  }
  return true;
}
