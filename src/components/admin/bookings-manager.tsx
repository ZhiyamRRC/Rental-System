"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  CircleAlert,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { formatUsd } from "@/lib/utils";
import { Modal, PageHeader, StatusPill } from "./ui";
import { useAdminApi } from "./admin-auth";
import { apiError } from "./api-utils";

export type AdminBooking = {
  id: number;
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  licenseCountry: string;
  partySize: number;
  message: string;
  totalDays: number;
  totalPrice: number;
  status: string;
  whatsappStatus: string;
  whatsappMessageId: string;
  whatsappError: string;
  whatsappSentAt: Date | string | null;
  customerWhatsappStatus: string;
  customerWhatsappMessageId: string;
  customerWhatsappError: string;
  customerNotifiedDecision: string;
  bikeName: string;
};

const filters = ["all", "pending", "confirmed", "active", "completed", "cancelled"];

const pillStyles: Record<string, string> = {
  sent: "border-seafoam/50 bg-seafoam/10 text-seafoam",
  failed: "border-ember/50 bg-ember/10 text-ember",
  not_configured: "border-amber/50 bg-amber/10 text-amber",
  pending: "border-line bg-mist/5 text-smoke",
};

function WhatsAppPill({ status, who }: { status: string; who: "Admin" | "Customer" }) {
  const labels: Record<string, string> = {
    sent: `${who} notified`,
    failed: `${who} msg failed`,
    not_configured: "WhatsApp setup needed",
    pending: `${who} not notified`,
  };
  const Icon = who === "Admin" ? MessageCircle : UserCheck;
  return (
    <span
      title={labels[status] ?? status}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-display text-[9px] font-bold tracking-[0.1em] uppercase ${pillStyles[status] ?? pillStyles.pending}`}
    >
      <Icon className="size-3" />
      <span className="hidden xl:inline">{labels[status] ?? status}</span>
    </span>
  );
}

export function BookingsManager({ initial }: { initial?: AdminBooking[] }) {
  const api = useAdminApi();

  const [list, setList] = useState<AdminBooking[]>(initial ?? []);
  const [loaded, setLoaded] = useState(!!initial);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<AdminBooking | null>(null);
  const [busy, setBusy] = useState(false);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    api("/api/admin/bookings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setList(json.bookings))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [api]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return list.filter(
      (b) =>
        (filter === "all" || b.status === filter) &&
        (!q ||
          b.customerName.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q) ||
          b.bikeName.toLowerCase().includes(q)),
    );
  }, [list, filter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    for (const b of list) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [list]);

  async function setStatus(booking: AdminBooking, status: string) {
    setActionError("");
    setNotice("");
    setList((current) => current.map((item) => (item.id === booking.id ? { ...item, status } : item)));
    try {
      const res = await api(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await apiError(res, `Update failed (HTTP ${res.status}).`));
      const body = (await res.json()) as {
        booking: AdminBooking;
        customerWhatsappStatus?: string | null;
      };
      setList((current) =>
        current.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                status: body.booking.status,
                customerWhatsappStatus: body.booking.customerWhatsappStatus ?? item.customerWhatsappStatus,
                customerWhatsappMessageId:
                  body.booking.customerWhatsappMessageId ?? item.customerWhatsappMessageId,
                customerWhatsappError: body.booking.customerWhatsappError ?? item.customerWhatsappError,
                customerNotifiedDecision:
                  body.booking.customerNotifiedDecision ?? item.customerNotifiedDecision,
              }
            : item,
        ),
      );

      // Tell the admin what happened to the automatic customer message.
      if (body.customerWhatsappStatus === "sent") {
        setNotice(`${booking.customerName} was notified on WhatsApp that the booking is ${status}.`);
      } else if (body.customerWhatsappStatus === "not_configured") {
        setActionError(
          "Status saved, but the customer was NOT messaged — WhatsApp API keys are not configured yet.",
        );
      } else if (body.customerWhatsappStatus === "failed") {
        setActionError(
          `Status saved, but the WhatsApp message to ${booking.customerName} failed. Use the Customer button to retry.`,
        );
      }
    } catch (e) {
      setList((current) => current.map((item) => (item.id === booking.id ? booking : item)));
      setActionError(e instanceof Error ? e.message : "Could not update booking status.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setBusy(true);
    setActionError("");
    try {
      const res = await api(`/api/admin/bookings/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await apiError(res, `Delete failed (HTTP ${res.status}).`));
      setList((current) => current.filter((booking) => booking.id !== target.id));
      setDeleting(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not delete the booking.");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }

  async function notifyWhatsApp(booking: AdminBooking, target: "admin" | "customer") {
    setNotifyingId(`${booking.id}:${target}`);
    setActionError("");
    setNotice("");
    try {
      const res = await api(`/api/admin/bookings/${booking.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const body = (await res.json()) as {
        whatsappStatus?: string;
        messageId?: string;
        recipient?: string;
        error?: string;
      };

      // Persisted status is useful even when Meta rejected the request.
      if (body.whatsappStatus) {
        setList((current) =>
          current.map((item) =>
            item.id === booking.id
              ? target === "admin"
                ? {
                    ...item,
                    whatsappStatus: body.whatsappStatus || item.whatsappStatus,
                    whatsappMessageId: body.messageId || "",
                    whatsappError: body.error || "",
                    whatsappSentAt: body.whatsappStatus === "sent" ? new Date().toISOString() : null,
                  }
                : {
                    ...item,
                    customerWhatsappStatus: body.whatsappStatus || item.customerWhatsappStatus,
                    customerWhatsappMessageId: body.messageId || "",
                    customerWhatsappError: body.error || "",
                    customerNotifiedDecision: body.whatsappStatus === "sent" ? item.status : "",
                  }
              : item,
          ),
        );
      }

      if (!res.ok) {
        const configHint =
          body.whatsappStatus === "not_configured"
            ? " Configure WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN and an approved template."
            : "";
        throw new Error((body.error || `WhatsApp send failed (HTTP ${res.status}).`) + configHint);
      }
      setNotice(
        target === "customer"
          ? `WhatsApp sent to ${booking.customerName} (${body.recipient || booking.phone}).`
          : "Booking details sent to the admin WhatsApp.",
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not send the WhatsApp notification.");
    } finally {
      setNotifyingId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Bookings" sub={`${list.length} reservations on record`} />

      {actionError && (
        <p className="mt-5 flex items-center gap-2 rounded-2xl border border-ember/50 bg-ember/10 px-5 py-4 text-sm text-ember">
          <CircleAlert className="size-4 shrink-0" /> {actionError}
        </p>
      )}

      {notice && (
        <p className="mt-5 flex items-center gap-2 rounded-2xl border border-seafoam/40 bg-seafoam/10 px-5 py-4 text-sm text-seafoam">
          <UserCheck className="size-4 shrink-0" /> {notice}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-1.5 font-display text-[11px] font-bold tracking-[0.12em] uppercase transition-colors ${
                filter === f
                  ? "border-ember bg-ember text-ink"
                  : "border-line text-smoke hover:border-mist/40 hover:text-mist"
              }`}
            >
              {f} {counts[f] ? `(${counts[f]})` : ""}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-smoke" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ref, bike…"
            className="w-full rounded-xl border border-line bg-ink py-2.5 pr-4 pl-9 text-sm outline-none placeholder:text-smoke focus:border-ember sm:w-64"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.map((b) => {
          const isOpen = open === b.id;
          return (
            <div
              key={b.id}
              data-booking-id={b.id}
              data-booking-ref={b.reference}
              className="booking-row overflow-hidden rounded-3xl border border-line bg-carbon"
            >
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
                <button
                  onClick={() => setOpen(isOpen ? null : b.id)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  aria-label={`Toggle details for booking ${b.reference}`}
                  aria-expanded={isOpen}
                >
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 text-smoke">
                    <ChevronDown className="size-4" />
                  </motion.span>
                  <span className="hidden font-mono text-xs font-bold text-ember sm:block">{b.reference}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {b.customerName} <span className="font-normal text-smoke">· {b.bikeName}</span>
                    </span>
                    <span className="block text-xs text-smoke">
                      {b.pickupDate} → {b.returnDate} · {b.totalDays}d
                    </span>
                  </span>
                  <span className="font-display text-sm font-bold">{formatUsd(b.totalPrice)}</span>
                </button>
                <StatusPill status={b.status} />
                <WhatsAppPill status={b.whatsappStatus || "pending"} who="Admin" />
                {(b.status === "confirmed" || b.status === "cancelled") && (
                  <WhatsAppPill status={b.customerWhatsappStatus || "pending"} who="Customer" />
                )}
                <button
                  onClick={() => notifyWhatsApp(b, "admin")}
                  disabled={notifyingId === `${b.id}:admin`}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-display text-[9px] font-bold tracking-[0.1em] text-smoke uppercase transition-colors hover:border-seafoam/50 hover:text-seafoam disabled:opacity-50"
                  aria-label={`${b.whatsappStatus === "sent" ? "Resend" : "Send"} admin WhatsApp notification for booking ${b.reference}`}
                  title="Send this booking to the admin WhatsApp"
                >
                  {notifyingId === `${b.id}:admin` ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <MessageCircle className="size-3.5" />
                  )}
                  <span className="hidden 2xl:inline">Admin</span>
                </button>
                {(b.status === "confirmed" || b.status === "cancelled") && (
                  <button
                    onClick={() => notifyWhatsApp(b, "customer")}
                    disabled={notifyingId === `${b.id}:customer`}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-display text-[9px] font-bold tracking-[0.1em] text-smoke uppercase transition-colors hover:border-seafoam/50 hover:text-seafoam disabled:opacity-50"
                    aria-label={`Message the customer about booking ${b.reference}`}
                    title={`Message ${b.customerName} that the booking was ${b.status}`}
                  >
                    {notifyingId === `${b.id}:customer` ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="size-3.5" />
                    )}
                    <span className="hidden 2xl:inline">Customer</span>
                  </button>
                )}
                <select
                  value={b.status}
                  onChange={(e) => setStatus(b, e.target.value)}
                  className="dark-controls rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-mist/80 outline-none focus:border-ember"
                >
                  {filters.slice(1).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setDeleting(b)}
                  className="grid size-9 place-items-center rounded-lg border border-line text-smoke transition-colors hover:border-ember hover:text-ember"
                  aria-label="Delete booking"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid gap-3 border-t border-line bg-ink/40 px-5 py-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <p className="flex items-center gap-2 text-mist/80">
                        <Mail className="size-4 text-ember" /> {b.email}
                      </p>
                      <p className="flex items-center gap-2 text-mist/80">
                        <Phone className="size-4 text-ember" /> {b.phone}
                      </p>
                      <p className="flex items-center gap-2 text-mist/80">
                        <MapPin className="size-4 text-ember" /> {b.pickupLocation}
                      </p>
                      <p className="flex items-center gap-2 text-mist/80">
                        <Users className="size-4 text-ember" /> {b.partySize} rider{b.partySize > 1 ? "s" : ""}
                        {b.licenseCountry ? ` · license: ${b.licenseCountry}` : ""}
                      </p>
                      {b.message && (
                        <p className="flex items-start gap-2 text-mist/70 sm:col-span-2 lg:col-span-4">
                          <FileText className="mt-0.5 size-4 shrink-0 text-ember" /> “{b.message}”
                        </p>
                      )}
                      {b.whatsappMessageId && (
                        <p className="flex items-center gap-2 break-all text-xs text-seafoam sm:col-span-2 lg:col-span-4">
                          <MessageCircle className="size-4 shrink-0" /> Meta message ID: {b.whatsappMessageId}
                        </p>
                      )}
                      {b.whatsappError && b.whatsappStatus !== "sent" && (
                        <p className="flex items-start gap-2 text-xs text-amber sm:col-span-2 lg:col-span-4">
                          <CircleAlert className="mt-0.5 size-4 shrink-0" /> Admin WhatsApp: {b.whatsappError}
                        </p>
                      )}
                      {b.customerWhatsappStatus === "sent" && (
                        <p className="flex items-center gap-2 text-xs text-seafoam sm:col-span-2 lg:col-span-4">
                          <UserCheck className="size-4 shrink-0" />
                          Customer notified on WhatsApp
                          {b.customerNotifiedDecision ? ` — booking ${b.customerNotifiedDecision}` : ""}
                          {b.customerWhatsappMessageId ? ` (${b.customerWhatsappMessageId})` : ""}
                        </p>
                      )}
                      {b.customerWhatsappError && b.customerWhatsappStatus !== "sent" && (
                        <p className="flex items-start gap-2 text-xs text-amber sm:col-span-2 lg:col-span-4">
                          <CircleAlert className="mt-0.5 size-4 shrink-0" /> Customer WhatsApp: {b.customerWhatsappError}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="rounded-3xl border border-dashed border-line py-16 text-center text-sm text-smoke">
            No bookings match this view.
          </p>
        )}
      </div>

      {deleting && (
        <Modal title="Delete booking?" onClose={() => setDeleting(null)}>
          <p className="text-sm leading-relaxed text-smoke">
            Booking <strong className="font-mono text-mist">{deleting.reference}</strong> for{" "}
            <strong className="text-mist">{deleting.customerName}</strong> will be permanently removed.
            Prefer to keep the record? Set its status to <em>cancelled</em> instead.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDeleting(null)}
              className="rounded-xl border border-line px-5 py-2.5 font-display text-xs font-bold tracking-[0.12em] text-mist/80 uppercase transition-colors hover:border-mist/40"
            >
              Keep it
            </button>
            <button
              onClick={confirmDelete}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl border border-ember/40 px-5 py-2.5 font-display text-xs font-bold tracking-[0.12em] text-ember uppercase transition-colors hover:bg-ember/10 disabled:opacity-50"
            >
              <Trash2 className="size-4" /> {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
