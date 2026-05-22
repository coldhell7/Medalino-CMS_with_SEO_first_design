import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center p-6"
          style={{ background: "var(--bg)", color: "var(--text-muted)" }}
        >
          <p className="text-sm">در حال بارگذاری…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
