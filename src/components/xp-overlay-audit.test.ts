import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const globalStyles = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf8",
);

test("mantém a decoração dos cards de XP fora da área das barras", () => {
  assert.match(
    globalStyles,
    /\.course-progress-card, \.missions-top \{[^}]*isolation: isolate/,
  );
  assert.match(
    globalStyles,
    /\.course-progress-card::after \{[^}]*top: -160px/,
  );
  assert.match(
    globalStyles,
    /\.missions-top::after \{[^}]*top: -155px/,
  );
});

test("mantém as barras de XP acima das decorações", () => {
  assert.match(
    globalStyles,
    /\.course-bar, \.week-progress \{[^}]*position: relative[^}]*z-index: 1/,
  );
});
