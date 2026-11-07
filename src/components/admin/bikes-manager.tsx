"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Bike as BikeIcon, CircleAlert, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Bike } from "@/db/schema";
import { categoryLabel, formatUsd } from "@/lib/utils";
import { AdminButton, Modal, PageHeader, StatusPill, adminInput, adminLabel } from "./ui";
import { useAdminApi } from "./admin-auth";
import { apiError } from "./api-utils";
import { ImageField } from "./image-field";

type FormState = {
  name: string;
  category: string;
  tagline: string;
  description: string;
  engineCc: number;
  transmission: string;
  seats: number;
  luggage: string;
  pricePerDay: number;
  deposit: number;
  features: string;
  imageUrl: string;
  status: string;
  featured: boolean;
  sortOrder: number;
};

const emptyForm: FormState = {
  name: "",
  category: "scooter",
  tagline: "",
  description: "",
  engineCc: 125,
  transmission: "Automatic",
  seats: 2,
  luggage: "Under-seat storage",
  pricePerDay: 10,
  deposit: 100,
  features: "",
  imageUrl: "",
  status: "available",
  featured: false,
  sortOrder: 0,
};

function bikeToForm(b: Bike): FormState {
  return {
    name: b.name,
    category: b.category,
    tagline: b.tagline,
    description: b.description,
    engineCc: b.engineCc,
    transmission: b.transmission,
    seats: b.seats,
    luggage: b.luggage,
    pricePerDay: b.pricePerDay,
    deposit: b.deposit,
    features: b.features.join("\n"),
    imageUrl: b.imageUrl,
    status: b.status,
    featured: b.featured,
    sortOrder: b.sortOrder,
  };
}

export function BikesManager({ initial = null }: { initial?: Bike[] | null }) {
  const api = useAdminApi();

  const [list, setList] = useState<Bike[] | null>(initial);
  const [modal, setModal] = useState<null | { mode: "create" } | { mode: "edit"; bike: Bike }>(null);
  const [deleting, setDeleting] = useState<Bike | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const bikes = list ?? [];

  async function refresh() {
    const res = await api("/api/admin/bikes");
    if (res.ok) setList((await res.json()).bikes);
  }

  function openCreate() {
    setForm(emptyForm);
    setError("");
    setModal({ mode: "create" });
  }

  function openEdit(bike: Bike) {
    setForm(bikeToForm(bike));
    setError("");
    setModal({ mode: "edit", bike });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setBusy(true);
    setError("");
    const payload = {
      ...form,
      category: form.category as FormState["category"],
      features: form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    };
    const isEdit = modal.mode === "edit";
    try {
      const res = await api(isEdit ? `/api/admin/bikes/${modal.bike.id}` : "/api/admin/bikes", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await apiError(res, `Save failed (HTTP ${res.status}).`));
      const body = (await res.json()) as { bike: Bike };
      setList((current) => {
        const existing = current ?? [];
        return isEdit
          ? existing.map((bike) => (bike.id === body.bike.id ? body.bike : bike))
          : [...existing, body.bike].sort((a, b) => a.sortOrder - b.sortOrder);
      });
      setModal(null);
      setActionError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the ride.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFeatured(bike: Bike) {
    const next = !bike.featured;
    setActionError("");
    // optimistic
    setList((current) => (current ?? []).map((item) => (item.id === bike.id ? { ...item, featured: next } : item)));
    try {
      const res = await api(`/api/admin/bikes/${bike.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: next }),
      });
      if (!res.ok) throw new Error(await apiError(res, `Update failed (HTTP ${res.status}).`));
      // authoritative sync from the server's saved row — cures optimistic-race flicker
      const body = (await res.json()) as { bike: Bike };
      setList((current) => (current ?? []).map((item) => (item.id === bike.id ? body.bike : item)));
    } catch (e) {
      setList((current) => (current ?? []).map((item) => (item.id === bike.id ? bike : item)));
      setActionError(e instanceof Error ? e.message : "Could not update featured status.");
    }
  }

  async function quickStatus(bike: Bike, status: string) {
    setActionError("");
    setList((current) => (current ?? []).map((item) => (item.id === bike.id ? { ...item, status } : item)));
    try {
      const res = await api(`/api/admin/bikes/${bike.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await apiError(res, `Update failed (HTTP ${res.status}).`));
      const body = (await res.json()) as { bike: Bike };
      setList((current) => (current ?? []).map((item) => (item.id === bike.id ? body.bike : item)));
    } catch (e) {
      setList((current) => (current ?? []).map((item) => (item.id === bike.id ? bike : item)));
      setActionError(e instanceof Error ? e.message : "Could not update ride status.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setBusy(true);
    setActionError("");
    try {
      const res = await api(`/api/admin/bikes/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await apiError(res, `Delete failed (HTTP ${res.status}).`));
      setList((current) => (current ?? []).filter((bike) => bike.id !== target.id));
      setDeleting(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not delete the ride.");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Fleet" sub={list === null ? "Loading the garage…" : `${bikes.length} vehicles in the garage`}>
        <AdminButton onClick={openCreate}>
          <Plus className="size-4" /> Add ride
        </AdminButton>
      </PageHeader>

      {actionError && (
        <p className="mt-5 flex items-center gap-2 rounded-2xl border border-ember/50 bg-ember/10 px-5 py-4 text-sm text-ember">
          <CircleAlert className="size-4 shrink-0" /> {actionError}
        </p>
      )}

      <div className="mt-8 space-y-3">
        {list === null &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl border border-line bg-carbon" />
          ))}
        {bikes.map((bike) => (
          <div
            key={bike.id}
            className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-carbon p-4"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-parchment">
              {bike.imageUrl ? (
                <Image src={bike.imageUrl} alt={bike.name} fill className="object-cover" sizes="64px" />
              ) : (
                <span className="grid size-full place-items-center text-ink/40">
                  <BikeIcon className="size-6" />
                </span>
              )}
            </div>
            <div className="min-w-44 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-display text-base font-bold">{bike.name}</p>
                <button
                  onClick={() => toggleFeatured(bike)}
                  aria-label="Toggle featured"
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-4 ${bike.featured ? "fill-amber text-amber" : "text-smoke/50"}`}
                  />
                </button>
              </div>
              <p className="mt-0.5 text-xs text-smoke">
                {categoryLabel[bike.category] ?? bike.category} · {bike.engineCc}cc · {formatUsd(bike.pricePerDay)}
                /day
              </p>
            </div>
            <div className="hidden sm:block">
              <StatusPill status={bike.status} />
            </div>
            <select
              value={bike.status}
              onChange={(e) => quickStatus(bike, e.target.value)}
              className="dark-controls rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-mist/80 outline-none focus:border-ember"
            >
              <option value="available">Available</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(bike)}
                className="grid size-9 place-items-center rounded-lg border border-line text-smoke transition-colors hover:border-ember hover:text-ember"
                aria-label={`Edit ${bike.name}`}
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => setDeleting(bike)}
                className="grid size-9 place-items-center rounded-lg border border-line text-smoke transition-colors hover:border-ember hover:text-ember"
                aria-label={`Delete ${bike.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {list !== null && bikes.length === 0 && (
          <p className="rounded-3xl border border-dashed border-line py-16 text-center text-sm text-smoke">
            The garage is empty — add your first ride.
          </p>
        )}
      </div>

      {/* create/edit modal */}
      {modal && (
        <Modal title={modal.mode === "create" ? "Add a new ride" : `Edit ${modal.bike.name}`} onClose={() => setModal(null)} wide>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={adminLabel}>Name</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={adminInput} placeholder="Urban Glide 125" />
            </label>
            <label className="block">
              <span className={adminLabel}>Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={adminInput}>
                <option value="scooter">Scooter</option>
                <option value="motorbike">Motorbike</option>
                <option value="tuktuk">Tuk-Tuk</option>
                <option value="car">Car & SUV</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className={adminLabel}>Tagline</span>
              <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={adminInput} placeholder="The beach-town hopper" />
            </label>
            <label className="block sm:col-span-2">
              <span className={adminLabel}>Description</span>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={adminInput} placeholder="Sell the ride in a few sentences…" />
            </label>
            <label className="block">
              <span className={adminLabel}>Engine (cc)</span>
              <input type="number" min={49} required value={form.engineCc} onChange={(e) => setForm({ ...form, engineCc: Number(e.target.value) })} className={adminInput} />
            </label>
            <label className="block">
              <span className={adminLabel}>Transmission</span>
              <select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} className={adminInput}>
                <option>Automatic</option>
                <option>Manual · 4-speed</option>
                <option>Manual · 5-speed</option>
                <option>Manual · 6-speed</option>
              </select>
            </label>
            <label className="block">
              <span className={adminLabel}>Seats</span>
              <input type="number" min={1} max={9} required value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })} className={adminInput} />
            </label>
            <label className="block">
              <span className={adminLabel}>Luggage</span>
              <input value={form.luggage} onChange={(e) => setForm({ ...form, luggage: e.target.value })} className={adminInput} />
            </label>
            <label className="block">
              <span className={adminLabel}>Price per day ($)</span>
              <input type="number" min={1} required value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })} className={adminInput} />
            </label>
            <label className="block">
              <span className={adminLabel}>Deposit ($)</span>
              <input type="number" min={0} required value={form.deposit} onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })} className={adminInput} />
            </label>
            <label className="block sm:col-span-2">
              <span className={adminLabel}>Included features — one per line</span>
              <textarea rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className={adminInput} placeholder={"Two helmets\nFull insurance\nPhone holder"} />
            </label>
            <div className="sm:col-span-2">
              <ImageField
                label="Photo"
                value={form.imageUrl}
                onChange={(imageUrl) => setForm({ ...form, imageUrl })}
                required
                hint="Upload a photo (recommended ~1600×1200, under 8 MB) or paste a custom URL."
              />
            </div>
            <label className="block">
              <span className={adminLabel}>Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={adminInput}>
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </label>
            <label className="block">
              <span className={adminLabel}>Sort order</span>
              <input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className={adminInput} />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 sm:col-span-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="size-4 accent-ember" />
              <span className="text-sm text-mist/80">Feature on the homepage showcase</span>
            </label>

            {error && <p className="rounded-xl border border-ember/50 bg-ember/10 px-4 py-3 text-xs text-ember sm:col-span-2">{error}</p>}

            <div className="flex justify-end gap-3 sm:col-span-2">
              <AdminButton variant="ghost" type="button" onClick={() => setModal(null)}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" disabled={busy}>
                {busy ? "Saving…" : modal.mode === "create" ? "Add ride" : "Save changes"}
              </AdminButton>
            </div>
          </form>
        </Modal>
      )}

      {/* delete modal */}
      {deleting && (
        <Modal title="Remove this ride?" onClose={() => setDeleting(null)}>
          <p className="text-sm leading-relaxed text-smoke">
            <strong className="text-mist">{deleting.name}</strong> can only be deleted if it has no booking
            history. If it has ever been rented, set it to <em>retired</em> so financial and customer records stay intact.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <AdminButton variant="ghost" onClick={() => setDeleting(null)}>
              Keep it
            </AdminButton>
            <AdminButton variant="danger" onClick={confirmDelete} disabled={busy}>
              <Trash2 className="size-4" /> {busy ? "Deleting…" : "Delete ride"}
            </AdminButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
