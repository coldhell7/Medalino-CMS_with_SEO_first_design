"use client";

import { useRef, useState } from "react";

const TOOLS = [
  { id: "bold", label: "B", cmd: "bold", title: "درشت" },
  { id: "italic", label: "I", cmd: "italic", title: "کج" },
  { id: "underline", label: "U", cmd: "underline", title: "زیرخط" },
  { id: "strikeThrough", label: "S", cmd: "strikeThrough", title: "خط‌خورده" },
  { id: "sep1", label: "|", cmd: "", title: "" },
  { id: "h2", label: "H2", cmd: "formatBlock", arg: "<h2>", title: "سرتیتر ۲" },
  { id: "h3", label: "H3", cmd: "formatBlock", arg: "<h3>", title: "سرتیتر ۳" },
  { id: "h4", label: "H4", cmd: "formatBlock", arg: "<h4>", title: "سرتیتر ۴" },
  { id: "p", label: "¶", cmd: "formatBlock", arg: "<p>", title: "پاراگراف" },
  { id: "sep2", label: "|", cmd: "", title: "" },
  { id: "ul", label: "•", cmd: "insertUnorderedList", title: "لیست" },
  { id: "ol", label: "1.", cmd: "insertOrderedList", title: "لیست شماره‌دار" },
  { id: "sep3", label: "|", cmd: "", title: "" },
  { id: "quote", label: "❝", cmd: "formatBlock", arg: "<blockquote>", title: "نقل قول" },
  { id: "code", label: "<>", cmd: "formatBlock", arg: "<pre>", title: "کد" },
  { id: "sep4", label: "|", cmd: "", title: "" },
  { id: "link", label: "🔗", cmd: "link", title: "لینک" },
  { id: "image", label: "🖼", cmd: "image", title: "تصویر" },
  { id: "sep5", label: "|", cmd: "", title: "" },
  { id: "alignRight", label: "☰→", cmd: "justifyRight", title: "راست‌چین" },
  { id: "alignCenter", label: "☰↔", cmd: "justifyCenter", title: "وسط‌چین" },
  { id: "alignLeft", label: "←☰", cmd: "justifyLeft", title: "چپ‌چین" },
  { id: "sep6", label: "|", cmd: "", title: "" },
  { id: "removeFormat", label: "✕", cmd: "removeFormat", title: "حذف قالب" },
  { id: "source", label: "{ }", cmd: "source", title: "نمایش HTML" },
];

export default function RichEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showSource, setShowSource] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(value);

  const exec = (tool: (typeof TOOLS)[0]) => {
    if (tool.cmd === "source") {
      if (showSource) {
        if (editorRef.current) editorRef.current.innerHTML = sourceHtml;
        onChange(sourceHtml);
      } else {
        if (editorRef.current) setSourceHtml(editorRef.current.innerHTML);
      }
      setShowSource(!showSource);
      return;
    }
    if (tool.cmd === "link") {
      const url = prompt("آدرس لینک:");
      if (url) document.execCommand("createLink", false, url);
      return;
    }
    if (tool.cmd === "image") {
      const url = prompt("آدرس تصویر:");
      if (url) document.execCommand("insertImage", false, url);
      return;
    }
    document.execCommand(tool.cmd, false, (tool as Record<string, string>).arg ?? "");
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="rounded-md border" style={{ borderColor: "var(--border)" }}>
      <div
        className="flex flex-wrap items-center gap-1 border-b p-2"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {TOOLS.map((tool) =>
          tool.label === "|" ? (
            <span key={tool.id} className="mx-1" style={{ color: "var(--border)" }}>|</span>
          ) : (
            <button
              key={tool.id}
              type="button"
              title={tool.title}
              onClick={() => exec(tool)}
              className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition hover:opacity-80"
              style={{
                background: showSource && tool.id === "source" ? "var(--accent)" : "transparent",
                color: showSource && tool.id === "source" ? "#fff" : "var(--text)",
              }}
            >
              {tool.label}
            </button>
          ),
        )}
      </div>
      {showSource ? (
        <textarea
          className="w-full rounded-b-md p-3 font-mono text-xs"
          style={{ background: "var(--bg)", color: "var(--text)", direction: "ltr", minHeight: "300px" }}
          value={sourceHtml}
          onChange={(e) => setSourceHtml(e.target.value)}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[300px] p-3 text-sm"
          style={{ background: "var(--bg)", color: "var(--text)", outline: "none" }}
          dangerouslySetInnerHTML={{ __html: value }}
          onInput={() => {
            if (editorRef.current) onChange(editorRef.current.innerHTML);
          }}
          data-placeholder={placeholder}
        />
      )}
    </div>
  );
}
