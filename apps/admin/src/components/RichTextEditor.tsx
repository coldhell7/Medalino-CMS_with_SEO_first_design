"use client";

import { useCallback, useRef, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number;
}

type ToolItem = { cmd: string; label: string; title: string; value?: string } | { sep: true };

const TOOLS: ToolItem[] = [
  { cmd: "bold", label: "B", title: "درشت" },
  { cmd: "italic", label: "I", title: "کج" },
  { cmd: "underline", label: "U", title: "زیرخط" },
  { cmd: "strikeThrough", label: "S", title: "خط‌خورده" },
  { sep: true },
  { cmd: "insertUnorderedList", label: "•", title: "لیست" },
  { cmd: "insertOrderedList", label: "1.", title: "لیست شماره‌دار" },
  { sep: true },
  { cmd: "justifyRight", label: "⫞", title: "راست‌چین" },
  { cmd: "justifyCenter", label: "⫿", title: "وسط‌چین" },
  { cmd: "justifyLeft", label: "⫟", title: "چپ‌چین" },
  { sep: true },
  { cmd: "createLink", label: "🔗", title: "لینک" },
  { cmd: "removeFormat", label: "✕", title: "پاک‌سازی فرمت" },
  { sep: true },
  { cmd: "formatBlock", value: "h2", label: "H2", title: "سرتیتر ۲" },
  { cmd: "formatBlock", value: "h3", label: "H3", title: "سرتیتر ۳" },
  { cmd: "formatBlock", value: "p", label: "P", title: "پاراگراف" },
  { sep: true },
  { cmd: "insertHorizontalRule", label: "—", title: "خط جدا" },
];

export default function RichTextEditor({ value, onChange, placeholder, height = 300 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  const exec = useCallback((cmd: string, val?: string) => {
    if (cmd === "createLink") {
      const url = prompt("آدرس لینک:");
      if (url) document.execCommand(cmd, false, url);
    } else if (cmd === "formatBlock") {
      document.execCommand(cmd, false, `<${val}>`);
    } else {
      document.execCommand(cmd, false, val);
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="rounded-md border" style={{ borderColor: "var(--border)" }}>
      <div
        className="flex flex-wrap items-center gap-1 border-b p-2"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {TOOLS.map((tool, i) =>
          "sep" in tool ? (
            <span key={i} className="mx-1" style={{ color: "var(--border)" }}>│</span>
          ) : (
            <button
              key={i}
              type="button"
              title={tool.title}
              onMouseDown={(e) => { e.preventDefault(); exec(tool.cmd, tool.value ?? ""); }}
              className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition hover:opacity-80"
              style={{ color: "var(--text)", background: "transparent" }}
            >
              {tool.label}
            </button>
          ),
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        dangerouslySetInnerHTML={{ __html: value }}
        className="p-4 text-sm"
        style={{
          minHeight: height,
          outline: "none",
          background: "var(--bg-elevated)",
          color: "var(--text)",
          direction: "rtl",
          lineHeight: "1.8",
        }}
        data-placeholder={placeholder}
      />
      {!focused && !value && placeholder && (
        <div
          className="pointer-events-none absolute px-4 py-3 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}
