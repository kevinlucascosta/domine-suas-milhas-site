import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const styles = readFileSync("src/app/globals.css", "utf8");

test("keeps Home content visible quickly and honors reduced motion", () => {
  assert.match(styles, /hero-entrance--proof \{ animation-delay: 240ms; \}/);
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.home-flow \.hero-entrance,[\s\S]*\.home-flow \.home-reveal\.is-revealed \.motion-stagger-card,[\s\S]*animation: none;/,
  );
});
