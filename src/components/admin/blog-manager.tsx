"use client";

import { useState } from "react";
import Image from "next/image";
import { CircleAlert, CircleCheck, Eye, EyeOff, Newspaper, Pencil, Plus, RefreshCw, Star, Trash2 } from "lucide-react";
import type { BlogPost } from "@/db/schema";
import { AdminButton, Modal, PageHeader, adminInput, adminLabel } from "./ui";
import { useAdminApi } from "./admin-auth";
import { ImageField } from "./image-field";

const categories = ["Routes", "Safety", "Guides", "Stories", "Fleet news"];

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  tags: string;
  readMinutes: number;
  published: boolean;
  featured: boolean;
};

const emptyForm = (author: string): FormState => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  author,
  category: "Routes",
  tags: "",
  readMinutes: 4,
  published: true,
  featured: false,
});

export function BlogManager({ authorDefault, initial = null }: { authorDefault: string; initial?: BlogPost[] | null }) {
  const api = useAdminApi();
  const [list, setList] = useState<BlogPost[] | null>(initial);
  const [modal, setModal] = useState<null | { mode: "create" } | { mode: "edit"; post: BlogPost }>(null);
  const [deleting, setDeleting] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(authorDefault));
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [notice, setNotice] = useState("");
  const posts = list ?? [];

  async function responseError(res: Response, fallback: string) {
    try {
      const body = (await res.json()) as { error?: string };
      return body.error || fallback;
    } catch {
      return fallback;
    }
  }

  async function refresh(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await api("/api/admin/blog", { cache: "no-store" });
      if (!res.ok) throw new Error(await responseError(res, `Could not load posts (HTTP ${res.status}).`));
      const body = (await res.json()) as { posts: BlogPost[] };
      setList(body.posts);
      setSyncError("");
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not connect to the blog service.";
      // Preserve SSR data. Never replace valid posts with an empty list on a transient failure.
      setList((current) => current ?? []);
      setSyncError(message);
      return false;
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }

  function openCreate() {
    setForm(emptyForm(authorDefault));
    setError("");
    setModal({ mode: "create" });
  }

  function openEdit(post: BlogPost) {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      author: post.author,
      category: post.category,
      tags: post.tags.join(", "),
      readMinutes: post.readMinutes,
      published: post.published,
      featured: post.featured,
    });
    setError("");
    setModal({ mode: "edit", post });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setBusy(true);
    setError("");
    setNotice("");
    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const isEdit = modal.mode === "edit";
    try {
      const res = await api(isEdit ? `/api/admin/blog/${modal.post.id}` : "/api/admin/blog", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(await responseError(res, `Could not save post (HTTP ${res.status}).`));
        return;
      }
      const body = (await res.json()) as { post: BlogPost };
      setList((current) => {
        const existing = current ?? [];
        return isEdit
          ? existing.map((post) => (post.id === body.post.id ? body.post : post))
          : [body.post, ...existing];
      });
      setModal(null);
      setSyncError("");
      setNotice(isEdit ? "Post updated successfully." : "Post created successfully.");
    } catch {
      setError("Network error while saving. Your draft remains in the editor; please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(post: BlogPost) {
    const next = !post.published;
    setSyncError("");
    setNotice("");
    setList((current) => (current ?? []).map((p) => (p.id === post.id ? { ...p, published: next } : p)));
    try {
      const res = await api(`/api/admin/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      });
      if (!res.ok) throw new Error(await responseError(res, `Update failed (HTTP ${res.status}).`));
      const body = (await res.json()) as { post: BlogPost };
      setList((current) => (current ?? []).map((p) => (p.id === post.id ? body.post : p)));
      setNotice(next ? "Post is now live on the website." : "Post moved back to drafts.");
    } catch (e) {
      setList((current) => (current ?? []).map((p) => (p.id === post.id ? post : p)));
      setSyncError(e instanceof Error ? e.message : "Could not change publication status.");
    }
  }

  async function toggleFeatured(post: BlogPost) {
    const next = !post.featured;
    setSyncError("");
    setNotice("");
    setList((current) => (current ?? []).map((p) => (p.id === post.id ? { ...p, featured: next } : p)));
    try {
      const res = await api(`/api/admin/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: next }),
      });
      if (!res.ok) throw new Error(await responseError(res, `Update failed (HTTP ${res.status}).`));
      const body = (await res.json()) as { post: BlogPost };
      setList((current) => (current ?? []).map((p) => (p.id === post.id ? body.post : p)));
      setNotice(next ? "Post added to the featured position." : "Post removed from the featured position.");
    } catch (e) {
      setList((current) => (current ?? []).map((p) => (p.id === post.id ? post : p)));
      setSyncError(e instanceof Error ? e.message : "Could not update featured status.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setSyncError("");
    setNotice("");
    try {
      const res = await api(`/api/admin/blog/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await responseError(res, `Delete failed (HTTP ${res.status}).`));
      setList((current) => (current ?? []).filter((post) => post.id !== deleting.id));
      setDeleting(null);
      setNotice("Post deleted.");
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Could not delete the post.");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }

  const live = posts.filter((p) => p.published).length;

  return (
    <div>
      <PageHeader
        title="Blog"
        sub={list === null ? "Loading posts…" : `${posts.length} posts · ${live} live on the website`}
      >
        <div className="flex gap-2">
          <AdminButton variant="ghost" onClick={() => refresh(true)} disabled={refreshing}>
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </AdminButton>
          <AdminButton onClick={openCreate}>
            <Plus className="size-4" /> Write post
          </AdminButton>
        </div>
      </PageHeader>

      {syncError && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber/50 bg-amber/10 px-5 py-4 text-sm text-amber">
          <span className="flex items-center gap-2">
            <CircleAlert className="size-4 shrink-0" />
            {syncError} Existing server-rendered posts are preserved.
          </span>
          <button onClick={() => refresh(true)} className="font-display text-[11px] font-bold tracking-wider uppercase underline underline-offset-4">
            Retry
          </button>
        </div>
      )}

      {notice && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-seafoam/40 bg-seafoam/10 px-5 py-4 text-sm text-seafoam">
          <CircleCheck className="size-4 shrink-0" />
          {notice}
        </div>
      )}

      <div className="mt-8 space-y-3">
        {list === null &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl border border-line bg-carbon" />
          ))}

        {posts.map((post) => (
          <div key={post.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-carbon p-4">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-graphite">
              {post.coverImage ? (
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="112px" />
              ) : (
                <span className="grid size-full place-items-center text-smoke">
                  <Newspaper className="size-6" />
                </span>
              )}
            </div>
            <div className="min-w-48 flex-1">
              <div className="flex items-center gap-2">
                <p className="line-clamp-1 font-display text-base font-bold">{post.title}</p>
                <button onClick={() => toggleFeatured(post)} aria-label="Toggle featured">
                  <Star className={`size-4 ${post.featured ? "fill-amber text-amber" : "text-smoke/50"}`} />
                </button>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-smoke">{post.excerpt}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-smoke">
                <span className="rounded-full bg-ink px-2 py-0.5 font-bold tracking-wider text-ember uppercase">
                  {post.category}
                </span>
                <span>{post.readMinutes} min read</span>
                <span>· {post.author}</span>
                <span>· {new Date(post.publishedAt).toLocaleDateString("en-GB")}</span>
              </p>
            </div>

            <span
              className={`rounded-full border px-2.5 py-0.5 font-display text-[10px] font-bold tracking-[0.14em] uppercase ${
                post.published
                  ? "border-seafoam/50 bg-seafoam/10 text-seafoam"
                  : "border-amber/50 bg-amber/10 text-amber"
              }`}
            >
              {post.published ? "Live" : "Draft"}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => togglePublish(post)}
                className="grid size-9 place-items-center rounded-lg border border-line text-smoke transition-colors hover:border-ember hover:text-ember"
                aria-label={post.published ? "Unpublish" : "Publish"}
              >
                {post.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              <button
                onClick={() => openEdit(post)}
                className="grid size-9 place-items-center rounded-lg border border-line text-smoke transition-colors hover:border-ember hover:text-ember"
                aria-label="Edit post"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => setDeleting(post)}
                className="grid size-9 place-items-center rounded-lg border border-line text-smoke transition-colors hover:border-ember hover:text-ember"
                aria-label="Delete post"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}

        {list !== null && posts.length === 0 && (
          <div className="rounded-3xl border border-dashed border-line py-16 text-center">
            <Newspaper className="mx-auto size-8 text-smoke" />
            <p className="mt-3 font-display text-lg font-bold">No posts yet</p>
            <p className="mt-1 text-sm text-smoke">Write your first story — it appears on the website instantly.</p>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal.mode === "create" ? "Write a new post" : `Edit post`}
          onClose={() => setModal(null)}
          wide
        >
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={adminLabel}>Title</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={adminInput}
                placeholder="The Tea Country Loop: 46km that beat every bus tour"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={adminLabel}>Excerpt — shown on the blog index</span>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className={adminInput}
                placeholder="One or two sentences that make people want to read on."
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={adminLabel}>
                Content — blank line between paragraphs, &quot;## &quot; for headings, &quot;- &quot; for bullets
              </span>
              <textarea
                rows={12}
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className={`${adminInput} font-mono text-xs leading-relaxed`}
                placeholder={"Opening paragraph…\n\n## A heading\n\nMore writing…\n\n- a bullet\n- another bullet"}
              />
            </label>
            <label className="block">
              <span className={adminLabel}>Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={adminInput}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={adminLabel}>Author</span>
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className={adminInput}
              />
            </label>
            <label className="block">
              <span className={adminLabel}>Tags — comma separated</span>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className={adminInput}
                placeholder="Day ride, Tea estates"
              />
            </label>
            <label className="block">
              <span className={adminLabel}>Read time (minutes)</span>
              <input
                type="number"
                min={1}
                max={60}
                value={form.readMinutes}
                onChange={(e) => setForm({ ...form, readMinutes: Number(e.target.value) })}
                className={adminInput}
              />
            </label>

            <div className="sm:col-span-2">
              <ImageField
                label="Cover image"
                value={form.coverImage}
                onChange={(coverImage) => setForm({ ...form, coverImage })}
                required
                hint="Upload a cover (~16:10, under 8 MB) or paste a custom URL."
              />
            </div>

            {modal.mode === "edit" && (
              <label className="block sm:col-span-2">
                <span className={adminLabel}>URL slug</span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className={adminInput}
                />
              </label>
            )}

            <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="size-4 accent-ember"
              />
              <span className="text-sm text-mist/80">Publish to the website</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="size-4 accent-ember"
              />
              <span className="text-sm text-mist/80">Feature as the lead story</span>
            </label>

            {error && (
              <p className="rounded-xl border border-ember/50 bg-ember/10 px-4 py-3 text-xs text-ember sm:col-span-2">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 sm:col-span-2">
              <AdminButton variant="ghost" type="button" onClick={() => setModal(null)}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" disabled={busy}>
                {busy ? "Saving…" : modal.mode === "create" ? "Publish post" : "Save changes"}
              </AdminButton>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete this post?" onClose={() => setDeleting(null)}>
          <p className="text-sm leading-relaxed text-smoke">
            <strong className="text-mist">{deleting.title}</strong> will be permanently removed from the
            website. Prefer to hide it instead? Switch it back to a draft.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <AdminButton variant="ghost" onClick={() => setDeleting(null)}>
              Keep it
            </AdminButton>
            <AdminButton variant="danger" onClick={confirmDelete} disabled={busy}>
              <Trash2 className="size-4" /> {busy ? "Deleting…" : "Delete post"}
            </AdminButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
