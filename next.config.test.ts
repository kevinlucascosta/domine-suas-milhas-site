import assert from "node:assert/strict";
import test from "node:test";

import { getContentSecurityPolicy } from "./next.config";

test("allows React development diagnostics without weakening the production CSP", () => {
  assert.match(getContentSecurityPolicy("development"), /'unsafe-eval'/);
  assert.doesNotMatch(getContentSecurityPolicy("production"), /'unsafe-eval'/);
});
