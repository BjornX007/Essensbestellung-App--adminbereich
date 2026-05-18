"use client";

import { useRef, useState } from "react";

type Props = {
  value: string;           // current image URL
  onChange: (url: string) => void;
  type: "product" | "category" | "logo" | "hero";
  label?: string;
};

export function ImageUpload({ value, onChange, type, label = "Image" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="img-upload-field">
      <label className="img-upload-label">{label}</label>

      <div
        className={`img-upload-zone ${loading ? "img-upload-zone--loading" : ""} ${value ? "img-upload-zone--has-img" : ""}`}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="img-upload-preview" />
            <div className="img-upload-overlay">
              <span>Replace</span>
            </div>
          </>
        ) : loading ? (
          <div className="img-upload-placeholder">
            <span className="spinner" />
            <span>Uploading…</span>
          </div>
        ) : (
          <div className="img-upload-placeholder">
            <span className="img-upload-icon">📷</span>
            <span className="img-upload-text">Click or drag to upload</span>
            <span className="img-upload-hint">JPG, PNG, WEBP · max 5MB</span>
          </div>
        )}
      </div>

      {value && !loading && (
        <button
          type="button"
          className="img-upload-remove"
          onClick={e => { e.stopPropagation(); onChange(""); }}
        >
          ✕ Remove image
        </button>
      )}

      {error && <div className="img-upload-error">{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleChange}
      />
    </div>
  );
}