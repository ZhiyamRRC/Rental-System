"use client";

import { useRef, useState } from "react";
import { ImageOff, Link2, Loader2, UploadCloud, X } from "lucide-react";
import { useAdminApi } from "./admin-auth";
import { apiError } from "./api-utils";
import { adminLabel, adminInput } from "./ui";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  required?: boolean;
};

/**
 * Image picker used across the admin panel. Exactly two sources are supported:
 *  1. Upload an image to the server
 *  2. Paste a custom image URL/path
 * There are deliberately no preset or pre-added image lists.
 */
export function ImageField({ value, onChange, label, hint, required = false }: Props) {
  const api = useAdminApi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imgBroken, setImgBroken] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setImgBroken(false);
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await api("/api/admin/uploads", { method: "POST", body: data });
      if (!res.ok) throw new Error(await apiError(res, `Upload failed (HTTP ${res.status}).`));
      const json = (await res.json()) as { url: string };
      onChange(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className={adminLabel}>
        {label} {required && <span className="text-ember">*</span>}
      </span>
      <div className="flex flex-wrap items-start gap-3">
        {/* live preview */}
        <span className="relative grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-graphite">
          {value && !imgBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="preview"
              className="size-full object-cover"
              onError={() => setImgBroken(true)}
              onLoad={() => setImgBroken(false)}
            />
          ) : (
            <ImageOff className="size-6 text-smoke/60" />
          )}
          {value && !imgBroken && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setImgBroken(false);
              }}
              className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-ink/80 text-mist/80 transition-colors hover:text-ember"
              aria-label="Clear image"
            >
              <X className="size-3" />
            </button>
          )}
        </span>

        <div className="min-w-52 flex-1 space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex items-center gap-2 rounded-xl bg-ember px-3.5 py-2 font-display text-[10px] font-bold tracking-[0.12em] text-ink uppercase transition-colors hover:bg-amber",
              "disabled:opacity-50",
            )}
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
            {uploading ? "Uploading…" : "Upload image"}
          </button>

          <div className="relative">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-smoke" />
            <input
              value={value}
              required={required}
              onChange={(e) => {
                onChange(e.target.value.trim());
                setImgBroken(false);
              }}
              placeholder="Paste image URL or /uploads/image.jpg"
              aria-label={`${label} custom URL`}
              className={cn(adminInput, "pl-8 text-xs")}
            />
          </div>

          {hint && <p className="text-[11px] text-smoke">{hint}</p>}
          {imgBroken && value && <p className="text-xs font-medium text-amber">Preview could not load this URL.</p>}
          {error && <p className="text-xs font-medium text-ember">{error}</p>}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
