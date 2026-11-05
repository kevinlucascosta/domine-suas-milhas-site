import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolve } from "node:path";

const accessPath = resolve(process.cwd(), "src/lib/course-access.ts");
const claimRoutePath = resolve(process.cwd(), "src/app/api/access/claim/route.ts");
const proxyPath = resolve(process.cwd(), "src/lib/supabase/proxy.ts");

test("o acesso ao curso depende de entitlement ativo, não de XP ou missões", () => {
  const access = readFileSync(accessPath, "utf8");
  const claimRoute = readFileSync(claimRoutePath, "utf8");
  const proxy = readFileSync(proxyPath, "utf8");

  assert.match(access, /from\("entitlements"\)/);
  assert.match(access, /claim_kiwify_access/);
  assert.match(claimRoute, /claimCourseAccessForUser/);
  assert.match(proxy, /from\("entitlements"\)/);
  assert.doesNotMatch(access, /xp_events|learning_mission|complete_learning_mission/);
  assert.doesNotMatch(claimRoute, /xp_events|learning_mission|complete_learning_mission/);
});
