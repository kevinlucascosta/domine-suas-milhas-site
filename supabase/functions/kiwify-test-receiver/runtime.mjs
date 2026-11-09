import { createClient } from "npm:@supabase/supabase-js@2.98.0";

const runtime = globalThis.Deno;
export const TEST_PROJECT_REF = "eejtatjyuivvvdgavoec";

// Somente o projeto de testes; nenhuma credencial é devolvida ou registrada.
export function isIsolatedProject() {
  try {
    return new URL(runtime.env.get("SUPABASE_URL")).hostname === `${TEST_PROJECT_REF}.supabase.co`;
  } catch {
    return false;
  }
}

// Interface de ambiente para reutilizar a validação do handler Next sem alterá-lo.
export const process = {
  env: {
    get KIWIFY_WEBHOOK_SECRET() { return runtime.env.get("KIWIFY_TEST_WEBHOOK_SECRET"); },
    get KIWIFY_PRODUCT_ID() { return runtime.env.get("KIWIFY_TEST_PRODUCT_ID") ?? "mr-test-product"; },
    get KIWIFY_PRODUCT_AMOUNT_CENTS() { return runtime.env.get("KIWIFY_TEST_PRODUCT_AMOUNT_CENTS") ?? "5000"; },
    get KIWIFY_PRODUCT_CURRENCY() { return runtime.env.get("KIWIFY_TEST_PRODUCT_CURRENCY") ?? "BRL"; },
  },
};

export const NextResponse = { json: (data, init) => Response.json(data, init) };

export function hasSupabaseServerConfig() {
  return isIsolatedProject() && Boolean(runtime.env.get("SUPABASE_SERVICE_ROLE_KEY"));
}

export function createServiceRoleClient() {
  if (!hasSupabaseServerConfig()) throw new Error("Isolated test project is not configured");
  return createClient(runtime.env.get("SUPABASE_URL"), runtime.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
