import { NextResponse } from "next/server";

const allowedCheckoutHost = "pay.kiwify.com.br";

export function GET() {
  // The hosted checkout URL is public. An environment variable can still
  // override it for future offers without exposing any secret.
  const checkoutUrl =
    process.env.KIWIFY_CHECKOUT_URL ?? "https://pay.kiwify.com.br/vbyzHHl";

  try {
    const destination = new URL(checkoutUrl);
    if (destination.protocol !== "https:" || destination.hostname !== allowedCheckoutHost) {
      return NextResponse.json({ error: "invalid_kiwify_checkout_url" }, { status: 500 });
    }
    return NextResponse.redirect(destination, 303);
  } catch {
    return NextResponse.json({ error: "invalid_kiwify_checkout_url" }, { status: 500 });
  }
}
