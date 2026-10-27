import type { NextConfig } from "next";

export function getContentSecurityPolicy(environment: string) {
  const developmentEval = environment === "development" ? " 'unsafe-eval'" : "";

  return (
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://pay.kiwify.com.br; " +
    `script-src 'self' 'unsafe-inline'${developmentEval}; ` +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.googleusercontent.com; media-src 'self' blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; frame-src 'none'; upgrade-insecure-requests"
  );
}

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: getContentSecurityPolicy(process.env.NODE_ENV ?? "production"),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
