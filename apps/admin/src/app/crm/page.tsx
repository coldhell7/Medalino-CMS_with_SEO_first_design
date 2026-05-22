"use client";

import { useState } from "react";
import { Surface } from "@repo/ui/react";

export default function CrmPage() {
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">ارتباط با مشتری</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          یادداشت گام‌به‌گام برای هر پروفایل مشتری. در تولید با Server Action به crm_notes وصل شود.
        </p>
      </div>
      <Surface title="یادداشت نماینده (پیش‌نویس محلی)">
        <label className="block text-sm font-medium" htmlFor="note">
          یادداشت
        </label>
        <textarea
          id="note"
          className="mt-2 w-full rounded-md border p-3 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          rows={6}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="نتیجه تماس، اعتراض مشتری، اقدام بعدی…"
        />
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          هنگام ذخیره، author_profile_id و order_id را به بک‌اند متصل کنید.
        </p>
      </Surface>
    </div>
  );
}
