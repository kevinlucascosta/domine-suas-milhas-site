import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const componentSource = readFileSync(
  join(process.cwd(), "src", "components", "learning-site.tsx"),
  "utf8",
);

const globalStyles = readFileSync(
  join(process.cwd(), "src", "app", "globals.css"),
  "utf8",
);

test("keeps only real learning and level cards in the Hero copy area", () => {
  assert.doesNotMatch(componentSource, /className="float-card float-points"/);
  assert.doesNotMatch(componentSource, /className="float-card float-badge"/);
  assert.match(componentSource, /className="hero-learning-cards"/);
});

test("keeps the requested Home Hero entrance active even when reduced motion is preferred", () => {
  assert.doesNotMatch(
    globalStyles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.hero-entrance/,
  );
});
