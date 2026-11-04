import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const homeSource = readFileSync("src/components/learning-site.tsx", "utf8");
const styles = readFileSync("src/app/globals.css", "utf8");

test("uses an amber accent only for Home progress and journey cards", () => {
  assert.match(homeSource, /const renderConcept = \(homeAccent = false\) =>/);
  assert.match(
    homeSource,
    /className=\{`concept-layout\$\{homeAccent \? " home-concept" : ""\}`\}/,
  );
  assert.match(homeSource, /\{renderConcept\(true\)\}/);
  assert.match(homeSource, /case 1:\s+return renderConcept\(\);/);
  assert.match(homeSource, /pillar-card motion-stagger-card/);
  assert.match(styles, /--amber: #D4A64A;/);
  assert.match(styles, /\.home-concept \.journey-node\.active/);
  assert.match(styles, /\.home-concept \.pillar-card:hover/);
  assert.match(styles, /\.hero-level-progress i \{[^}]*var\(--amber\)/);
});
