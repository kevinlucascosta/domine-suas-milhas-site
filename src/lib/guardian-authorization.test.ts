import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { canContinueWithGuardianAuthorization } from "./guardian-authorization";

test("blocks account creation and checkout until guardian authorization is confirmed", () => {
  assert.equal(canContinueWithGuardianAuthorization(false), false);
  assert.equal(canContinueWithGuardianAuthorization(true), true);
});

test("uses the confirmation in both account creation and checkout", () => {
  const componentSource = readFileSync(
    join(process.cwd(), "src", "components", "learning-site.tsx"),
    "utf8",
  );

  assert.match(componentSource, /guardianAuthorizationConfirmed/);
  assert.match(componentSource, /onChange=\{\(event\) => setGuardianAuthorizationConfirmed\(event\.target\.checked\)\}/);
  assert.match(componentSource, /onClick=\{handleCheckout\}/);
});
