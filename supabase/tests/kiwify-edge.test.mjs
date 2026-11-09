import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import * as crypto from "node:crypto";
import * as buffer from "node:buffer";

// Executa os módulos reais; somente a fronteira de rede do SDK é simulada.
async function receiver(overrides = {}, rpcResult = { data: true, error: null }) {
  const environment = {
    SUPABASE_URL: "https://eejtatjyuivvvdgavoec.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "fixture-not-a-real-key",
    KIWIFY_TEST_WEBHOOK_SECRET: "fixture-only-secret",
    ...overrides,
  };
  const calls = [];
  let callback;
  const context = createContext({
    Request, Response, URL,
    Deno: { env: { get: (key) => environment[key] }, serve: (handler) => { callback = handler; } },
  });
  const modules = new Map();
  const root = new URL("../functions/kiwify-test-receiver/", import.meta.url);
  async function load(specifier) {
    if (modules.has(specifier)) return modules.get(specifier);
    let loadedModule;
    if (specifier.startsWith("node:")) {
      const exports = specifier === "node:crypto" ? crypto : buffer;
      loadedModule = new SyntheticModule(Object.keys(exports), function () {
        for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
      }, { context });
    } else if (specifier.startsWith("npm:")) {
      loadedModule = new SyntheticModule(["createClient"], function () {
        this.setExport("createClient", (url, key) => {
          assert.equal(url, environment.SUPABASE_URL);
          assert.equal(key, environment.SUPABASE_SERVICE_ROLE_KEY);
          return { rpc: async (...args) => { calls.push(args); return rpcResult; } };
        });
      }, { context });
    } else {
      loadedModule = new SourceTextModule(await readFile(new URL(specifier, root), "utf8"), { context });
    }
    modules.set(specifier, loadedModule);
    return loadedModule;
  }
  const entry = await load("./index.mjs");
  await entry.link(load);
  await entry.evaluate({ timeout: 1000 });
  return { send: callback, calls };
}

const payload = {
  order_id: "fixture-order", order_status: "paid", webhook_event_type: "order_approved",
  updated_at: "2026-11-01T10:00:00Z",
  Customer: { email: " PAYMENT-SMOKE@example.invalid " },
  Product: { product_id: "mr-test-product" },
  Commissions: { charge_amount: 5000, currency: "BRL" },
};
function request(body = payload, key = "fixture-only-secret") {
  return new Request(`https://test.invalid/receiver?key=${key}`, {
    method: "POST", body: JSON.stringify(body),
  });
}

test("projeto diferente e segredo ausente permanecem fechados", async () => {
  for (const overrides of [
    { SUPABASE_URL: "https://other-project.supabase.co" },
    { KIWIFY_TEST_WEBHOOK_SECRET: undefined },
  ]) {
    const { send, calls } = await receiver(overrides);
    assert.equal((await send(request())).status, 503);
    assert.equal(calls.length, 0);
  }
});

test("GET é rejeitado e segredo incorreto não chama banco", async () => {
  const { send, calls } = await receiver();
  const get = await send(new Request("https://test.invalid/receiver"));
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("Allow"), "POST");
  assert.equal((await send(request(payload, "wrong"))).status, 401);
  assert.equal(calls.length, 0);
});

test("aprovação fictícia normaliza a chamada RPC sem depender de Buffer global", async () => {
  const { send, calls } = await receiver();
  const response = await send(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true, duplicate: false });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "process_kiwify_event");
  assert.equal(calls[0][1].p_buyer_email, "payment-smoke@example.invalid");
  assert.equal(calls[0][1].p_status, "active");
  assert.equal(calls[0][1].p_amount_cents, 5000);
  assert.equal(calls[0][1].p_product_id, "mr-test-product");
  assert.match(calls[0][1].p_payload_sha256, /^[a-f0-9]{64}$/);
});

test("valor, moeda ou produto incorretos não chamam banco", async () => {
  for (const body of [
    { ...payload, Commissions: { charge_amount: 1, currency: "BRL" } },
    { ...payload, Commissions: { charge_amount: 5000, currency: "USD" } },
    { ...payload, Product: { product_id: "other-product" } },
  ]) {
    const { send, calls } = await receiver();
    assert.equal((await send(request(body))).status, 400);
    assert.equal(calls.length, 0);
  }
});

test("reembolso fictício solicita revogação", async () => {
  const { send, calls } = await receiver();
  assert.equal((await send(request({ ...payload, order_status: "refunded" }))).status, 200);
  assert.equal(calls[0][1].p_status, "revoked");
});

test("falha externa e duplicata retornam respostas distintas", async () => {
  const failed = await receiver({}, { data: null, error: { message: "fixture" } });
  assert.equal((await failed.send(request())).status, 500);
  const duplicate = await receiver({}, { data: false, error: null });
  assert.deepEqual(await (await duplicate.send(request())).json(), { received: true, duplicate: true });
});
