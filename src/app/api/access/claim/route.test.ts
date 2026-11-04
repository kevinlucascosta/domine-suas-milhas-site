import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const source = readFileSync(
  resolve(process.cwd(), "src/app/api/access/claim/route.ts"),
  "utf8",
);

test("valida a sessão pelo token assinado sem uma consulta remota de usuário", () => {
  assert.match(source, /supabase\.auth\.getClaims\(\)/);
  assert.doesNotMatch(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /const userId = claims\?\.claims\.sub;/);
});
