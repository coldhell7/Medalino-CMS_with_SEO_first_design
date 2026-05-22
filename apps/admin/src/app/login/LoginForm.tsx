"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const safeNextPath = (from: string | null): string => {
    if (!from || !from.startsWith("/") || from.startsWith("//")) return "/dashboard";
    return from;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setMsg(data.message ?? "ورود ناموفق.");
        return;
      }
      router.replace(safeNextPath(search.get("from")));
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="w-full max-w-sm rounded-lg border p-8"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <h1 className="text-xl font-bold">ورود به پنل</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          نام کاربری و رمز را وارد کنید.
        </p>
        <form onSubmit={(e) => void submit(e)} className="mt-6 flex flex-col gap-4">
          <label className="block text-sm font-medium">
            نام کاربری
            <input
              autoComplete="username"
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            رمز عبور
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {msg ? <p className="text-sm text-red-400">{msg}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md py-2.5 text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {loading ? "در حال ورود…" : "ورود"}
          </button>
        </form>
      </div>
    </div>
  );
}
