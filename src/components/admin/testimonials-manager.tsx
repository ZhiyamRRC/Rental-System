"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Plus, Star, Trash2, Undo2 } from "lucide-react";
import type { Testimonial } from "@/db/schema";
import { AdminButton, adminInput, adminLabel, PageHeader } from "./ui";
import { useAdminApi } from "./admin-auth";
import { apiError } from "./api-utils";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-3 ${i < n ? "fill-amber text-amber" : "text-line"}`} />
      ))}
    </span>
  );
}

export function TestimonialsManager({ initial }: { initial?: Testimonial[] }) {
  const api = useAdminApi();

  const [list, setList] = useState<Testimonial[]>(initial ?? []);
  const [loaded, setLoaded] = useState(!!initial);
  const [addOpen, setAddOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    api("/api/admin/testimonials")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setList([...json.testimonials].sort((a, b) => Number(a.approved) - Number(b.approved) || a.id - b.id)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [api]);

  const pending = list.filter((t) => !t.approved);
  const live = list.filter((t) => t.approved);

  async function patch(testimonial: Testimonial, data: Record<string, unknown>) {
    setActionError("");
    setList((current) =>
      current.map((item) =>
        item.id === testimonial.id ? { ...item, ...(data as Partial<Testimonial>) } : item,
      ),
    );
    try {
      const res = await api(`/api/admin/testimonials/${testimonial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await apiError(res, `Update failed (HTTP ${res.status}).`));
      const body = (await res.json()) as { testimonial: Testimonial };
      setList((current) => current.map((item) => (item.id === testimonial.id ? body.testimonial : item)));
    } catch (e) {
      setList((current) => current.map((item) => (item.id === testimonial.id ? testimonial : item)));
      setActionError(e instanceof Error ? e.message : "Could not update the review.");
    }
  }

  async function remove(testimonial: Testimonial) {
    setActionError("");
    try {
      const res = await api(`/api/admin/testimonials/${testimonial.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await apiError(res, `Delete failed (HTTP ${res.status}).`));
      setList((current) => current.filter((item) => item.id !== testimonial.id));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not delete the review.");
    }
  }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setActionError("");
    try {
      const res = await api("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          country: data.country,
          bikeName: data.bikeName,
          rating: Number(data.rating),
          content: data.content,
          approved: true,
        }),
      });
      if (!res.ok) throw new Error(await apiError(res, `Create failed (HTTP ${res.status}).`));
      const body = (await res.json()) as { testimonial: Testimonial };
      setList((current) => [...current, body.testimonial]);
      setAddOpen(false);
      form.reset();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not create the review.");
    }
  }

  function Card({ t }: { t: Testimonial }) {
    return (
      <div className="flex flex-col rounded-3xl border border-line bg-carbon p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-sm font-bold">{t.name}</p>
            <p className="text-xs text-smoke">
              {t.country}
              {t.bikeName ? ` · rode ${t.bikeName}` : ""}
            </p>
          </div>
          <Stars n={t.rating} />
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-mist/75">“{t.content}”</p>
        <div className="mt-4 flex gap-2 border-t border-line pt-4">
          {t.approved ? (
            <button
              onClick={() => patch(t, { approved: false })}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-smoke uppercase transition-colors hover:border-mist/40 hover:text-mist"
            >
              <Undo2 className="size-3.5" /> Unpublish
            </button>
          ) : (
            <button
              onClick={() => patch(t, { approved: true })}
              className="flex items-center gap-1.5 rounded-lg bg-seafoam px-3 py-1.5 text-xs font-bold text-ink uppercase transition-colors hover:brightness-110"
            >
              <Check className="size-3.5" /> Approve
            </button>
          )}
          <button
            onClick={() => remove(t)}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-smoke uppercase transition-colors hover:border-ember hover:text-ember"
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reviews" sub={`${live.length} live · ${pending.length} waiting for approval`}>
        <AdminButton onClick={() => setAddOpen(!addOpen)}>
          <Plus className="size-4" /> Add manually
        </AdminButton>
      </PageHeader>

      {actionError && (
        <p className="mt-5 flex items-center gap-2 rounded-2xl border border-ember/50 bg-ember/10 px-5 py-4 text-sm text-ember">
          <CircleAlert className="size-4 shrink-0" /> {actionError}
        </p>
      )}

      {addOpen && (
        <form onSubmit={add} className="mt-6 grid gap-3 rounded-3xl border border-line bg-carbon p-6 sm:grid-cols-2">
          <label className="block">
            <span className={adminLabel}>Name</span>
            <input name="name" required className={adminInput} />
          </label>
          <label className="block">
            <span className={adminLabel}>Country</span>
            <input name="country" required className={adminInput} />
          </label>
          <label className="block">
            <span className={adminLabel}>Bike (optional)</span>
            <input name="bikeName" className={adminInput} />
          </label>
          <label className="block">
            <span className={adminLabel}>Rating</span>
            <select name="rating" defaultValue="5" className={adminInput}>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} stars
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={adminLabel}>Review</span>
            <textarea name="content" required rows={3} className={adminInput} />
          </label>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <AdminButton variant="ghost" type="button" onClick={() => setAddOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton type="submit">Publish review</AdminButton>
          </div>
        </form>
      )}

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xs font-bold tracking-[0.24em] text-amber uppercase">
            Awaiting approval ({pending.length})
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pending.map((t) => (
              <Card key={t.id} t={t} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xs font-bold tracking-[0.24em] text-seafoam uppercase">
          Live on the site ({live.length})
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {live.map((t) => (
            <Card key={t.id} t={t} />
          ))}
        </div>
        {loaded && live.length === 0 && (
          <p className="mt-4 rounded-3xl border border-dashed border-line py-12 text-center text-sm text-smoke">
            No live reviews yet — approve the waiting ones above.
          </p>
        )}
      </section>
    </div>
  );
}
