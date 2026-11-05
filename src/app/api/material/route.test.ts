import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { resolve } from "node:path";

const routePath = resolve(process.cwd(), "src/app/api/material/[document]/route.ts");
const proxyPath = resolve(process.cwd(), "src/lib/supabase/proxy.ts");
const readerPath = resolve(process.cwd(), "src/components/study-document-reader.tsx");

test("entrega materiais apenas por rota com claims, entitlement e allowlist", () => {
  assert.equal(existsSync(routePath), true, "a rota protegida de materiais deve existir");

  const route = readFileSync(routePath, "utf8");
  assert.match(route, /export const runtime = "nodejs"/);
  assert.match(route, /createServerSupabaseClient/);
  assert.match(route, /auth\.getClaims\(\)/);
  assert.match(route, /from\("entitlements"\)/);
  assert.match(route, /o-que-sao-milhas\.pdf/);
  assert.match(route, /programas-de-fidelidade\.pdf/);
  assert.doesNotMatch(route, /join\([^)]*params\.document/);
});

test("página e leitor usam o mesmo limite premium sem expor o caminho antigo", () => {
  const proxy = readFileSync(proxyPath, "utf8");
  const reader = readFileSync(readerPath, "utf8");

  assert.match(proxy, /"\/material"/);
  assert.match(reader, /\/api\/material\//);
  assert.doesNotMatch(reader, /"\/lesson-01\/o-que-sao-milhas\.pdf"/);
  assert.doesNotMatch(reader, /"\/lesson-01\/programas-de-fidelidade\.pdf"/);
});
