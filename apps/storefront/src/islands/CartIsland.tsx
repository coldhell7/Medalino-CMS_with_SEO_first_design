import * as React from "react";

const { useMemo, useState, createElement: h } = React;

export default function CartIsland() {
  const [open, setOpen] = useState(false);
  const count = useMemo(() => 0, []);

  return h(
    "div",
    { style: { position: "relative" } },
    h(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        style: {
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          background: "var(--bg-muted)",
          padding: "10px 14px",
          cursor: "pointer",
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
        },
      },
      "سبد (",
      count,
      ")",
    ),
    open
      ? h(
          "div",
          {
            style: {
              position: "absolute",
              insetInlineEnd: 0,
              marginTop: 8,
              width: 280,
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              boxShadow: "var(--shadow-2)",
              padding: "var(--space-4)",
              fontSize: "var(--text-sm)",
              textAlign: "start",
            },
          },
          "پوسته سبد سازگار با SSR. اتصال به تسویه را بعداً وصل کنید.",
        )
      : null,
  );
}
