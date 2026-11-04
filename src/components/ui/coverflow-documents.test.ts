import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync("src/components/ui/coverflow-documents.tsx", "utf8");

test("keeps document navigation entirely manual", () => {
  assert.doesNotMatch(source, /setInterval\s*\(/);
  assert.match(source, /onTouchStart=\{onTouchStart\}/);
  assert.match(source, /onClick=\{\(\) => move\(-1\)\}/);
  assert.match(source, /onClick=\{\(\) => move\(1\)\}/);
});
