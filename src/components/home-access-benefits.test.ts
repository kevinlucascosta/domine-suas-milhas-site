import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync("src/components/learning-site.tsx", "utf8");
const styles = readFileSync("src/app/site.css", "utf8");

test("shows the one-time access privileges only in the Home enrollment call", () => {
  assert.match(source, /className="home-access-benefits"/);
  assert.match(source, /<b>PAGAMENTO ÚNICO<\/b>/);
  assert.match(source, /<b>ACESSO COMPLETO<\/b>/);
  assert.match(source, /<b>ATUALIZAÇÕES INCLUÍDAS<\/b>/);
  assert.match(source, /"Acesso completo às aulas e aos recursos da plataforma"/);
  assert.match(source, /"Atualizações futuras incluídas, sem nova cobrança"/);
  assert.match(source, /"O valor atual pode mudar conforme novos módulos e atualizações forem adicionados\."/);
  assert.match(styles, /\.home-access-benefits \{/);
  assert.match(styles, /\.home-access-benefits li::before/);
});
