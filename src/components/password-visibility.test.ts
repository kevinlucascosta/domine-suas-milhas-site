import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "src/components/learning-site.tsx"),
  "utf8",
);

test("permite alternar a visibilidade nos campos de senha ativos", () => {
  assert.match(source, /const \[showAuthPassword, setShowAuthPassword\] = useState\(false\)/);
  assert.match(source, /const \[showNewPassword, setShowNewPassword\] = useState\(false\)/);
  assert.match(source, /const \[showNewPasswordConfirmation, setShowNewPasswordConfirmation\] =\s*useState\(false\)/);
  assert.match(source, /type=\{showAuthPassword \? "text" : "password"\}/);
  assert.match(source, /type=\{showNewPassword \? "text" : "password"\}/);
  assert.match(source, /type=\{showNewPasswordConfirmation \? "text" : "password"\}/);
  assert.match(source, /passwordVisibilityLabels\[language\]\.show/);
  assert.match(source, /passwordVisibilityLabels\[language\]\.hide/);
  assert.match(source, /aria-pressed=\{showAuthPassword\}/);
});
