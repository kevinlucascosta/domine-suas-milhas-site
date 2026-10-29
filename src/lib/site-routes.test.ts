import assert from "node:assert/strict";
import test from "node:test";

import { publicSiteRoutes } from "./site-routes";

test("does not expose the demonstration dashboard as a public route", () => {
  assert.equal(
    publicSiteRoutes.some((route) => String(route.path) === "/painel"),
    false,
  );
});
