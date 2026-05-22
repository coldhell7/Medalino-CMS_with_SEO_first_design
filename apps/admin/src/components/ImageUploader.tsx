"use client";

import { useRef, useState } from "react";

export default function ImageUploader({
  value,
  onChange,
  label = "تصویر",
  size = "thumbnail",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  size?: "thumbnail" | "medium" | "large";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const sizeMap = { thumbnail: "150x150", medium: "600x400", large: "1200x800" };

  const convertToWebP = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            } else reject(new Error("تبدیل به WebP ناموفق"));
          },
          "image/webp",
          0.85,
        );
      };
      img.onerror = () => reject(new Error("خطا در بارگذاری تصویر"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("فقط فایل تصویری مجاز است");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم فایل باید کمتر از ۵ مگابایت باشد");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const webpDataUrl = await convertToWebP(file);
      onChange(webpDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt={label}
              className="rounded-md border object-cover"
              style={{ borderColor: "var(--border)", width: size === "thumbnail" ? 80 : size === "medium" ? 200 : 320, height: "auto" }}
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
            >
              ×
            </button>
          </div>
        ) : (
          <div
            className="flex cursor-pointer items-center justify-center rounded-md border border-dashed"
            style={{ borderColor: "var(--border)", width: size === "thumbnail" ? 80 : size === "medium" ? 200 : 320, height: size === "thumbnail" ? 80 : 120 }}
            onClick={() => inputRef.current?.click()}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {uploading ? "در حال تبدیل…" : "کلیک یا درگ"}
            </span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-md border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          آپلود تصویر
        </button>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          خودکار به WebP تبدیل می‌شود — {sizeMap[size]}
        </span>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
