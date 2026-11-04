import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "src/components/learning-site.tsx"),
  "utf8",
);

test("mostra a verificação imediatamente e bloqueia um segundo login pendente", () => {
  assert.match(source, /const authRequestInFlightRef = useRef\(false\)/);
  assert.match(
    source,
    /const handleAccountAccess = async \(\) => \{[\s\S]*?if \(authRequestInFlightRef\.current\) return;/,
  );
  assert.match(source, /flushSync\(\(\) => setAuthBusy\(true\)\);/);
  assert.match(source, /authRequestInFlightRef\.current = false;/);
});
