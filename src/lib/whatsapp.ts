import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bikes, bookings } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { formatDate, formatUsd } from "@/lib/utils";

export type WhatsAppStatus = "sent" | "failed" | "not_configured";

/** Decisions that trigger an automatic message to the customer. */
export type BookingDecision = "confirmed" | "cancelled";

export type WhatsAppNotificationResult = {
  status: WhatsAppStatus;
  messageId: string;
  error: string;
  recipient: string;
  fallbackUrl: string;
};

type BookingContext = {
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bikeName: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  licenseCountry: string;
  partySize: number;
  totalDays: number;
  totalPrice: number;
  message: string;
};

/** WhatsApp API wants international digits only — no +, spaces, or punctuation. */
export function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function fallbackUrl(to: string, text: string) {
  return to ? `https://wa.me/${to}?text=${encodeURIComponent(text)}` : "";
}

/* ----------------------------- message bodies ----------------------------- */

export function adminBookingText(b: BookingContext) {
  return [
    "🏍️ *NEW BIKE RENTAL BOOKING*",
    "",
    `*Reference:* ${b.reference}`,
    `*Customer:* ${b.customerName}`,
    `*WhatsApp / Phone:* ${b.customerPhone}`,
    `*Email:* ${b.customerEmail}`,
    `*Licence country:* ${b.licenseCountry || "Not supplied"}`,
    `*Riders:* ${b.partySize}`,
    "",
    `*Ride:* ${b.bikeName}`,
    `*Pickup:* ${formatDate(b.pickupDate)} — ${b.pickupLocation}`,
    `*Return:* ${formatDate(b.returnDate)}`,
    `*Duration:* ${b.totalDays} day${b.totalDays === 1 ? "" : "s"}`,
    `*Trip total:* ${formatUsd(b.totalPrice)}`,
    b.message ? `*Customer note:* ${b.message}` : "",
    "",
    "Open Garage Control → Bookings to confirm or contact the customer.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function customerDecisionText(b: BookingContext, decision: BookingDecision, contactPhone: string) {
  if (decision === "confirmed") {
    return [
      "✅ *BOOKING CONFIRMED — Ceylon Ride Co.*",
      "",
      `Hi ${b.customerName}, your ride is confirmed!`,
      "",
      `*Reference:* ${b.reference}`,
      `*Ride:* ${b.bikeName}`,
      `*Pickup:* ${formatDate(b.pickupDate)} — ${b.pickupLocation}`,
      `*Return:* ${formatDate(b.returnDate)}`,
      `*Duration:* ${b.totalDays} day${b.totalDays === 1 ? "" : "s"}`,
      `*Total:* ${formatUsd(b.totalPrice)} (payable at pickup)`,
      "",
      "Please bring your passport, home driving licence and IDP.",
      `Questions? Reply here or call ${contactPhone}.`,
      "",
      "See you in the hills! 🏍️",
    ].join("\n");
  }

  return [
    "⚠️ *BOOKING NOT AVAILABLE — Ceylon Ride Co.*",
    "",
    `Hi ${b.customerName}, we're very sorry — we could not confirm this booking.`,
    "",
    `*Reference:* ${b.reference}`,
    `*Ride:* ${b.bikeName}`,
    `*Requested:* ${formatDate(b.pickupDate)} – ${formatDate(b.returnDate)}`,
    "",
    "Nothing has been charged. We'd love to find you another ride or different dates.",
    `Reply here or call ${contactPhone} and the crew will sort it out.`,
  ].join("\n");
}

/* ------------------------------- API sender ------------------------------- */

type SendOptions = {
  to: string;
  text: string;
  templateName?: string;
  templateParams?: string[];
};

/**
 * Send through Meta WhatsApp Cloud API.
 *
 * Required env:
 *   WHATSAPP_PHONE_NUMBER_ID — sending number ID from Meta API Setup
 *   WHATSAPP_ACCESS_TOKEN    — permanent System User access token
 *
 * When a template name is supplied the message is sent as an approved
 * business-initiated template (required outside the 24-hour window);
 * otherwise a plain text message is attempted.
 */
async function sendWhatsApp({ to, text, templateName, templateParams }: SendOptions): Promise<WhatsAppNotificationResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const recipient = normalizeWhatsAppNumber(to);
  const base = { recipient, fallbackUrl: fallbackUrl(recipient, text) };

  if (!phoneNumberId || !accessToken || !recipient) {
    const missing = [
      !phoneNumberId && "WHATSAPP_PHONE_NUMBER_ID",
      !accessToken && "WHATSAPP_ACCESS_TOKEN",
      !recipient && "recipient WhatsApp number",
    ]
      .filter(Boolean)
      .join(", ");
    return { ...base, status: "not_configured", messageId: "", error: `Missing: ${missing}` };
  }

  if (recipient.length < 8 || recipient.length > 15) {
    return { ...base, status: "failed", messageId: "", error: `Recipient "${to}" is not a valid E.164 number.` };
  }

  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US";
  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [
            {
              type: "body",
              parameters: (templateParams ?? []).map((value) => ({
                type: "text",
                text: String(value).slice(0, 1024),
              })),
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: { preview_url: false, body: text },
      };

  const version = (process.env.WHATSAPP_GRAPH_VERSION || "v23.0").replace(/^\/?/, "");
  const apiBase = (process.env.WHATSAPP_API_BASE_URL || "https://graph.facebook.com").replace(/\/$/, "");
  const endpoint = `${apiBase}/${version}/${encodeURIComponent(phoneNumberId)}/messages`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    const raw = await response.text();
    let json: { messages?: Array<{ id?: string }>; error?: { message?: string } } = {};
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      // keep a bounded fragment only; never log credentials
    }

    if (!response.ok || !json.messages?.[0]?.id) {
      const message = json.error?.message || `Meta API HTTP ${response.status}`;
      return { ...base, status: "failed", messageId: "", error: message.slice(0, 500) };
    }
    return { ...base, status: "sent", messageId: json.messages[0].id || "", error: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhatsApp request failed";
    return { ...base, status: "failed", messageId: "", error: message.slice(0, 500) };
  }
}

/* ------------------------------ data loading ------------------------------ */

async function loadBooking(reference: string) {
  const rows = await db
    .select({ booking: bookings, bikeName: bikes.name })
    .from(bookings)
    .innerJoin(bikes, eq(bookings.bikeId, bikes.id))
    .where(eq(bookings.reference, reference))
    .limit(1);
  if (rows.length === 0) return null;
  const { booking, bikeName } = rows[0];
  const context: BookingContext = {
    reference: booking.reference,
    customerName: booking.customerName,
    customerPhone: booking.phone,
    customerEmail: booking.email,
    bikeName,
    pickupDate: booking.pickupDate,
    returnDate: booking.returnDate,
    pickupLocation: booking.pickupLocation,
    licenseCountry: booking.licenseCountry,
    partySize: booking.partySize,
    totalDays: booking.totalDays,
    totalPrice: booking.totalPrice,
    message: booking.message,
  };
  return { id: booking.id, context };
}

const notFound: WhatsAppNotificationResult = {
  status: "failed",
  messageId: "",
  error: "Booking not found.",
  recipient: "",
  fallbackUrl: "",
};

/* --------------------------- public notifications -------------------------- */

/** Booking created → message the ADMIN's WhatsApp with the full details. */
export async function notifyAdminOfBooking(reference: string): Promise<WhatsAppNotificationResult> {
  const loaded = await loadBooking(reference);
  if (!loaded) return notFound;
  const { id, context } = loaded;

  const settings = await getSettings();
  const adminNumber = process.env.WHATSAPP_ADMIN_TO || settings.contact.whatsapp;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();

  const result = await sendWhatsApp({
    to: adminNumber,
    text: adminBookingText(context),
    templateName,
    templateParams: [
      context.reference,
      context.customerName,
      context.customerPhone,
      context.bikeName,
      `${formatDate(context.pickupDate)} – ${formatDate(context.returnDate)}`,
      context.pickupLocation,
      formatUsd(context.totalPrice),
    ],
  });

  await db
    .update(bookings)
    .set({
      whatsappStatus: result.status,
      whatsappMessageId: result.messageId,
      whatsappError: result.error,
      whatsappSentAt: result.status === "sent" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id));

  return result;
}

/**
 * Admin confirmed/declined → message the CUSTOMER's WhatsApp number
 * (the phone they supplied on the booking form).
 */
export async function notifyCustomerOfDecision(
  reference: string,
  decision: BookingDecision,
): Promise<WhatsAppNotificationResult> {
  const loaded = await loadBooking(reference);
  if (!loaded) return notFound;
  const { id, context } = loaded;

  const settings = await getSettings();
  const contactPhone = settings.contact.phone;
  const templateName =
    decision === "confirmed"
      ? process.env.WHATSAPP_TEMPLATE_CONFIRMED?.trim()
      : process.env.WHATSAPP_TEMPLATE_DECLINED?.trim();

  const result = await sendWhatsApp({
    to: context.customerPhone,
    text: customerDecisionText(context, decision, contactPhone),
    templateName,
    templateParams:
      decision === "confirmed"
        ? [
            context.customerName,
            context.reference,
            context.bikeName,
            `${formatDate(context.pickupDate)} – ${formatDate(context.returnDate)}`,
            context.pickupLocation,
            formatUsd(context.totalPrice),
          ]
        : [
            context.customerName,
            context.reference,
            context.bikeName,
            `${formatDate(context.pickupDate)} – ${formatDate(context.returnDate)}`,
            contactPhone,
          ],
  });

  await db
    .update(bookings)
    .set({
      customerWhatsappStatus: result.status,
      customerWhatsappMessageId: result.messageId,
      customerWhatsappError: result.error,
      customerNotifiedDecision: result.status === "sent" ? decision : "",
      customerWhatsappSentAt: result.status === "sent" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id));

  return result;
}
