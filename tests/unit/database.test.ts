import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { database } from "../../src/lib/cms/database";

function configure(t: TestContext) {
  const values = {
    SUPABASE_URL: " https://psxkpfymzezlcsaasomg.supabase.co ",
    SUPABASE_SERVICE_ROLE_KEY: "",
    TELEGRAM_BOT_TOKEN: "12345:fixture",
    TELEGRAM_ADMIN_USER_ID: "123456789",
    TELEGRAM_WEBHOOK_SECRET: "fixture-webhook-secret-that-is-long-enough",
    CMS_PREVIEW_SECRET: "fixture-preview-secret-that-is-long-enough",
  };
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  const fetch = globalThis.fetch;
  Object.assign(process.env, values);
  t.after(() => {
    globalThis.fetch = fetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

const credentials = [
  { key: "sb_secret_local_test_fixture", authorization: null },
  { key: "legacy-service-role-fixture", authorization: "Bearer legacy-service-role-fixture" },
];

test("CMS REST authenticates modern server secrets without treating them as JWTs", async (t) => {
  configure(t);
  for (const { key, authorization } of credentials) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = " " + key + " ";
    let requested = false;
    globalThis.fetch = async (input, options) => {
      assert.equal(new URL(String(input)).pathname, "/rest/v1/cms_entries");
      const headers = new Headers(options?.headers);
      assert.equal(headers.get("apikey"), key);
      assert.equal(headers.get("authorization"), authorization);
      requested = true;
      return Response.json([{ id: "fixture-entry" }]);
    };
    assert.deepEqual(await database("cms_entries?select=id&limit=1"), [{ id: "fixture-entry" }]);
    assert.equal(requested, true);
  }
});
