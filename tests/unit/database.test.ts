import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { database } from "../../src/lib/cms/database";
import { attachmentText } from "../../src/lib/telegram/api";

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

test("Telegram media uploads use the same server-key authentication as the database", async (t) => {
  configure(t);
  const image = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0, 0, 0, 0, 0]);
  for (const { key, authorization } of credentials) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = key;
    let uploaded = false;
    globalThis.fetch = async (input, options) => {
      const url = new URL(String(input));
      if (url.hostname === "api.telegram.org") {
        if (url.pathname.endsWith("/getFile"))
          return Response.json({ ok: true, result: { file_path: "photos/fixture.png" } });
        assert.equal(url.pathname, "/file/bot12345:fixture/photos/fixture.png");
        return new Response(image);
      }
      assert.equal(url.hostname, "psxkpfymzezlcsaasomg.supabase.co");
      assert.match(url.pathname, /^\/storage\/v1\/object\/portfolio-media\/[a-f0-9-]+\.png$/);
      assert.equal(options?.method, "POST");
      const headers = new Headers(options?.headers);
      assert.equal(headers.get("apikey"), key);
      assert.equal(headers.get("authorization"), authorization);
      assert.equal(headers.get("content-type"), "image/png");
      uploaded = true;
      return Response.json({ Key: "fixture" });
    };
    const url = await attachmentText(
      {
        update_id: 1,
        message: {
          from: { id: 123456789 },
          chat: { id: 123456789, type: "private" },
          photo: [{ file_id: "fixture-photo", file_size: image.length }],
        },
      },
      "image",
    );
    assert.match(
      url!,
      /^https:\/\/psxkpfymzezlcsaasomg\.supabase\.co\/storage\/v1\/object\/public\/portfolio-media\/[a-f0-9-]+\.png$/,
    );
    assert.equal(uploaded, true);
  }
});
