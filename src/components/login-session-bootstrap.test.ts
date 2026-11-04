import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const source = readFileSync(
  resolve(process.cwd(), "src/components/learning-site.tsx"),
  "utf8",
);

test("restaura a sessão local sem esperar a consulta remota de usuário", () => {
  const sessionBootstrap = source.match(
    /if \(!hasSupabaseBrowserConfig\(\)\) return;\s*const supabase = createSupabaseClient\(\);[\s\S]{0,500}?supabase\.auth\.onAuthStateChange/,
  )?.[0];

  assert.ok(sessionBootstrap, "o efeito de inicialização da sessão deve existir");
  assert.match(sessionBootstrap, /supabase\.auth\s*\.getSession\(\)/);
  assert.doesNotMatch(sessionBootstrap, /supabase\.auth\s*\.getUser\(\)/);
});
