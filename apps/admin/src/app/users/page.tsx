"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Surface } from "@repo/ui/react";
import { formatJalaliDate } from "@repo/shared";
import type { DemoUser, UserRole } from "@/server/demo-users-store";

type RoleFilter = "all" | UserRole;

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "مدیر",
  sales: "فروشنده",
  customer: "مشتری",
};

const ROLE_COLOR: Record<UserRole, string> = {
  admin: "#7c3aed",
  sales: "#0ea5e9",
  customer: "#059669",
};

export default function UsersPage() {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<RoleFilter>("all");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const j = (await res.json()) as { ok?: boolean; users?: DemoUser[]; message?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.message ?? "خطا در بارگذاری کاربران");
        setUsers([]);
        return;
      }
      setUsers(j.users ?? []);
      setMsg(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const c = { all: users.length, admin: 0, sales: 0, customer: 0 };
    for (const u of users) c[u.role] += 1;
    return c;
  }, [users]);

  const filtered = useMemo(
    () => (filter === "all" ? users : users.filter((u) => u.role === filter)),
    [users, filter],
  );

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, phone, role }),
      });
      const j = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.message ?? "ثبت نشد");
        return;
      }
      setFullName("");
      setEmail("");
      setPhone("");
      setRole("customer");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: DemoUser) => {
    const res = await fetch(`/api/users/${encodeURIComponent(user.id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    if (res.ok) await load();
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">مدیریت کاربران</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          مدیران، فروشندگان و مشتریان (شامل کسانی که سفارش ثبت کرده‌اند). نقش‌ها: مدیر، فروشنده، مشتری.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: "all" as const, label: "همه", count: stats.all },
          { key: "admin" as const, label: "مدیر", count: stats.admin },
          { key: "sales" as const, label: "فروشنده", count: stats.sales },
          { key: "customer" as const, label: "مشتری", count: stats.customer },
        ].map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setFilter(s.key)}
            className="rounded-lg border px-4 py-3 text-start transition"
            style={{
              borderColor: filter === s.key ? "var(--accent)" : "var(--border)",
              background: filter === s.key ? "var(--surface)" : "var(--bg)",
            }}
          >
            <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-black">{s.count.toLocaleString("fa-IR")}</p>
          </button>
        ))}
      </div>

      <Surface title="افزودن کاربر">
        <form onSubmit={(e) => void addUser(e)} className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-medium">
            نام
            <input
              required
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            ایمیل
            <input
              required
              type="email"
              dir="ltr"
              className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
              style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            موبایل
            <input
              dir="ltr"
              className="mt-1 w-full rounded-md border p-2 text-sm font-mono"
              style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            نقش
            <select
              className="mt-1 w-full rounded-md border p-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="admin">مدیر</option>
              <option value="sales">فروشنده</option>
              <option value="customer">مشتری</option>
            </select>
          </label>
          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {saving ? "در حال ذخیره…" : "افزودن کاربر"}
            </button>
          </div>
        </form>
        {msg ? <p className="mt-3 text-sm text-red-400">{msg}</p> : null}
      </Surface>

      <Surface title="لیست کاربران">
        {loading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            در حال بارگذاری…
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[640px] text-start text-sm">
              <thead>
                <tr style={{ color: "var(--text-muted)" }}>
                  <th className="pb-3 font-bold">نام</th>
                  <th className="pb-3 font-bold">ایمیل</th>
                  <th className="pb-3 font-bold">موبایل</th>
                  <th className="pb-3 font-bold">نقش</th>
                  <th className="pb-3 font-bold">سفارش</th>
                  <th className="pb-3 font-bold">عضویت</th>
                  <th className="pb-3 font-bold">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="py-3 font-medium">{u.full_name}</td>
                    <td className="py-3 font-mono text-xs" dir="ltr">
                      {u.email}
                    </td>
                    <td className="py-3 font-mono text-xs" dir="ltr">
                      {u.phone || "—"}
                    </td>
                    <td className="py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-bold"
                        style={{
                          background: `${ROLE_COLOR[u.role]}22`,
                          color: ROLE_COLOR[u.role],
                        }}
                      >
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="py-3">
                      {u.role === "customer" ? u.orders_count.toLocaleString("fa-IR") : "—"}
                    </td>
                    <td className="py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatJalaliDate(u.created_at, { time: true })}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(u)}
                        className="rounded-md border px-2 py-1 text-xs font-bold"
                        style={{
                          borderColor: "var(--border)",
                          color: u.active ? "#059669" : "#dc2626",
                        }}
                      >
                        {u.active ? "فعال" : "غیرفعال"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center" style={{ color: "var(--text-muted)" }}>
                      کاربری یافت نشد.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </div>
  );
}
