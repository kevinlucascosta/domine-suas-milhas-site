import { POST } from "./handler.mjs";
import { isIsolatedProject, process } from "./runtime.mjs";

globalThis.Deno.serve(async (request) => {
  if (!isIsolatedProject()) {
    return Response.json({ error: "test_project_mismatch" }, { status: 503 });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
  }
  // Sem segredo exclusivo, o receptor permanece fechado e não processa eventos.
  if (!process.env.KIWIFY_WEBHOOK_SECRET) {
    return Response.json({ error: "test_secret_not_configured" }, { status: 503 });
  }
  try {
    return await POST(request);
  } catch {
    return Response.json({ error: "test_processing_failed" }, { status: 500 });
  }
});
