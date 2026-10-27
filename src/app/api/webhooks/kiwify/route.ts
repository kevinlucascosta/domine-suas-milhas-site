import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceRoleClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

type KiwifyPayload = {
  order_id?: string;
  order_status?: string;
  webhook_event_type?: string;
  updated_at?: string;
  approved_date?: string;
  Product?: { product_id?: string };
  Customer?: { email?: string; full_name?: string };
  Commissions?: { charge_amount?: string | number; currency?: string };
};

const MAX_WEBHOOK_BYTES = 64 * 1024;

function matchesSecret(actual: string | null, expected: string | undefined) {
  if (!actual || !expected) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function parseOccurredAt(payload: KiwifyPayload) {
  const candidate = payload.updated_at ?? payload.approved_date;
  const parsed = candidate ? new Date(candidate) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function parseExpectedAmountCents(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;
  if (!matchesSecret(new URL(request.url).searchParams.get("key"), webhookSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "access_not_configured" }, { status: 503 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody) > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }
  let payload: KiwifyPayload;
  try {
    payload = JSON.parse(rawBody) as KiwifyPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const orderId = payload.order_id?.trim();
  const email = payload.Customer?.email?.trim().toLowerCase();
  const productId = payload.Product?.product_id?.trim();
  const expectedProductId = process.env.KIWIFY_PRODUCT_ID;
  const expectedAmountCents = parseExpectedAmountCents(process.env.KIWIFY_PRODUCT_AMOUNT_CENTS);
  const expectedCurrency = (process.env.KIWIFY_PRODUCT_CURRENCY ?? "BRL").trim().toUpperCase();
  const parsedAmount = Number(payload.Commissions?.charge_amount);
  const amountCents = Number.isInteger(parsedAmount) && parsedAmount >= 0 ? parsedAmount : null;
  const currency = payload.Commissions?.currency?.trim().toUpperCase();
  if (!orderId || !email || !productId || !expectedProductId || productId !== expectedProductId) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }
  if (expectedAmountCents === null || !currency) {
    return NextResponse.json({ error: "payment_validation_not_configured" }, { status: 503 });
  }
  if (amountCents === null || amountCents !== expectedAmountCents || currency !== expectedCurrency) {
    return NextResponse.json({ error: "payment_mismatch" }, { status: 400 });
  }

  const status = payload.order_status?.toLowerCase();
  const accessStatus = status === "paid" ? "active" : ["refunded", "chargedback", "chargeback", "canceled"].includes(status ?? "") ? "revoked" : null;
  if (!accessStatus) return NextResponse.json({ received: true, ignored: true });

  const eventType = payload.webhook_event_type?.trim() || `order_${status}`;
  const eventKey = `${eventType}:${orderId}:${payload.updated_at ?? payload.approved_date ?? ""}`;
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");

  const service = createServiceRoleClient();
  const { data, error } = await service.rpc("process_kiwify_event", {
    p_event_key: eventKey,
    p_event_type: eventType,
    p_payload_sha256: payloadHash,
    p_purchase_id: orderId,
    p_buyer_email: email,
    p_product_id: productId,
    p_status: accessStatus,
    p_amount_cents: amountCents,
    p_currency: currency,
    p_occurred_at: parseOccurredAt(payload),
  });

  if (error) return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  return NextResponse.json({ received: true, duplicate: !data });
}
