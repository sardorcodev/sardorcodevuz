import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  baseCopy,
  applyOverrides,
  flattenCopy,
  fingerprint,
  validateDraft,
  validateSettings,
  mutationSchema,
} from "../../src/lib/control/model";
import { readJson, sameOrigin } from "../../src/lib/control/http";
import type { ControlEntry, SettingsRow } from "../../src/lib/control/model";

test("copy overrides preserve repo defaults, arrays, locale boundaries and structural fields", () => {
  const base = baseCopy("uz"),
    path = "dictionary.home.title";
  const keys = flattenCopy(base);
  const allowed = Object.keys(keys)[0];
  const copy = applyOverrides(base, {
    [allowed]: "Paneldan yangi matn",
    "__proto__.polluted": "yes",
    "dictionary.projects.0.id": "hijack",
  });
  assert.equal(flattenCopy(copy)[allowed], "Paneldan yangi matn");
  assert.equal(flattenCopy(base)[allowed], keys[allowed]);
  assert.deepEqual(copy.dictionary.projects, base.dictionary.projects);
  assert.equal(Object.hasOwn(Object.prototype, "polluted"), false);
  assert.throws(() => validateSettings("uz", { [path + ".invalid"]: "unknown" }));
  assert.throws(() => validateSettings("global", { github: "javascript:alert(1)" }));
  assert.throws(() => validateSettings("global", { portrait: "https://evil.test/a.png" }));
  assert.deepEqual(validateSettings("global", { animation: false }), { animation: false });
  assert.equal(fingerprint({ a: 1, b: [2, 3] }), fingerprint({ b: [2, 3], a: 1 }));
  assert.notEqual(fingerprint([1, 2]), fingerprint([2, 1]));
  assert.ok(Object.keys(flattenCopy(baseCopy("en"))).length > 100);
});
test("drafts remain incomplete but bounded; origin and streamed body checks reject bypasses", async () => {
  assert.deepEqual(validateDraft("post", { title: "" }), { title: "" });
  assert.throws(() => validateDraft("post", { revision: 4 }));
  assert.throws(() => validateDraft("project", { stack: [5] }));
  assert.throws(() =>
    mutationSchema.parse({ requestId: randomUUID(), target: "entry", op: "publish", revision: 0 }),
  );
  assert.throws(() =>
    sameOrigin(
      new Request("https://example.test/api", { headers: { origin: "https://evil.test" } }),
    ),
  );
  assert.throws(() =>
    sameOrigin(
      new Request("https://example.test/api", {
        headers: { origin: "https://example.test", "sec-fetch-site": "cross-site" },
      }),
    ),
  );
  assert.doesNotThrow(() =>
    sameOrigin(
      new Request("http://localhost:3000/api", {
        headers: {
          origin: "https://sardorcodev.uz",
          host: "sardorcodev.uz",
          "x-forwarded-proto": "https",
        },
      }),
    ),
  );
  assert.throws(() =>
    sameOrigin(
      new Request("http://localhost:3000/api", {
        headers: {
          origin: "https://foreign.test",
          host: "sardorcodev.uz",
          "x-forwarded-proto": "https",
        },
      }),
    ),
  );
  assert.doesNotThrow(() =>
    sameOrigin(
      new Request("https://example.test/api", { headers: { origin: "https://example.test" } }),
    ),
  );
  const body = new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body: "я".repeat(60000) }),
  });
  assert.equal((await readJson(body)).body.length, 60000);
  await assert.rejects(
    () =>
      readJson(
        new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "123456",
        }),
        5,
      ),
    /juda katta/,
  );
});
test("actual migrations enforce atomic control operations, isolation and recovery", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);",
    );
    const folder = new URL("../../supabase/migrations/", import.meta.url);
    for (const name of readdirSync(folder)
      .filter((n) => n.endsWith(".sql"))
      .sort())
      await db.exec(readFileSync(new URL(name, folder), "utf8"));
    await db.exec("set role service_role");
    const actor = randomUUID(),
      id = randomUUID();
    const mutation = async (payload: Record<string, unknown>, requestId = randomUUID()) =>
      (
        await db.query<{ value: { entry: ControlEntry; settings: SettingsRow } }>(
          "select control_mutate($1,$2,$3::jsonb) as value",
          [actor, requestId, JSON.stringify(payload)],
        )
      ).rows[0].value;
    let row: ControlEntry;
    await t.test("create and replay produce one entry and one history snapshot", async () => {
      const request = randomUUID(),
        payload = {
          target: "entry",
          op: "create",
          id,
          kind: "post",
          slug: "control-test",
          locale: "uz",
          draft: { title: "Initial" },
        };
      row = (await mutation(payload, request)).entry;
      assert.equal(row.revision, 1);
      assert.equal(row.published, null);
      assert.deepEqual((await mutation(payload, request)).entry, row);
      assert.equal(
        (await db.query("select * from cms_versions where entry_id=$1", [id])).rows.length,
        1,
      );
      await assert.rejects(
        () => mutation({ ...payload, slug: "different" }, request),
        /Request ID reused/,
      );
    });
    await t.test("stale writes and invalid operations roll back history and receipts", async () => {
      row = (
        await mutation({
          target: "entry",
          op: "save",
          id,
          revision: 1,
          draft: { title: "Updated" },
        })
      ).entry;
      const before = (await db.query("select * from cms_versions where entry_id=$1", [id])).rows
          .length,
        receipt = randomUUID();
      await assert.rejects(
        () =>
          mutation(
            { target: "entry", op: "save", id, revision: 1, draft: { title: "Stale" } },
            receipt,
          ),
        /Content changed/,
      );
      await assert.rejects(
        () => mutation({ target: "entry", op: "unknown", id, revision: row.revision }),
        /Unknown operation/,
      );
      assert.equal(
        (await db.query("select * from control_requests where id=$1", [receipt])).rows.length,
        0,
      );
      assert.equal(
        (await db.query("select * from cms_versions where entry_id=$1", [id])).rows.length,
        before,
      );
    });
    await t.test(
      "publish, draft, restore and archive preserve public snapshot and publication date",
      async () => {
        row = (
          await mutation({
            target: "entry",
            op: "publish",
            id,
            revision: row.revision,
            draft: { title: "Published" },
          })
        ).entry;
        const firstDate = row.published_at,
          publishedDate = (
            await db.query<{ value: string }>(
              "select published_updated_at as value from cms_entries where id=$1",
              [id],
            )
          ).rows[0].value;
        row = (
          await mutation({
            target: "entry",
            op: "save",
            id,
            revision: row.revision,
            draft: { title: "Private draft" },
          })
        ).entry;
        assert.equal(row.published?.title, "Published");
        assert.deepEqual(
          (
            await db.query<{ value: string }>(
              "select published_updated_at as value from cms_entries where id=$1",
              [id],
            )
          ).rows[0].value,
          publishedDate,
        );
        const version = (
          await db.query<{ id: string }>(
            "select id from cms_versions where entry_id=$1 and snapshot->'draft'->>'title'='Initial' limit 1",
            [id],
          )
        ).rows[0].id;
        row = (
          await mutation({
            target: "entry",
            op: "restore",
            id,
            revision: row.revision,
            versionId: version,
          })
        ).entry;
        assert.equal(row.draft.title, "Initial");
        assert.equal(row.published?.title, "Published");
        row = (await mutation({ target: "entry", op: "archive", id, revision: row.revision }))
          .entry;
        assert.ok(row.archived_at);
        assert.equal(row.published, null);
        await assert.rejects(
          () => mutation({ target: "entry", op: "publish", id, revision: row.revision, draft: {} }),
          /archived/,
        );
        row = (await mutation({ target: "entry", op: "unarchive", id, revision: row.revision }))
          .entry;
        assert.equal(row.archived_at, null);
        assert.equal(row.published, null);
        row = (
          await mutation({
            target: "entry",
            op: "publish",
            id,
            revision: row.revision,
            draft: { title: "Again" },
          })
        ).entry;
        assert.equal(row.published_at, firstDate);
        row = (await mutation({ target: "entry", op: "unpublish", id, revision: row.revision }))
          .entry;
        assert.equal(row.published, null);
        assert.equal(row.draft.title, "Again");
      },
    );
    await t.test(
      "translations and settings publish independently; restoring does not publish",
      async () => {
        const translated = (
          await mutation({
            target: "entry",
            op: "create",
            id: randomUUID(),
            kind: "post",
            slug: "control-test",
            locale: "en",
            draft: { title: "English draft" },
          })
        ).entry;
        assert.equal(translated.published, null);
        let settings = (
          await mutation({
            target: "settings",
            key: "uz",
            op: "publish",
            revision: 1,
            draft: { "workshop.blog": "My blog" },
          })
        ).settings;
        settings = (
          await mutation({
            target: "settings",
            key: "uz",
            op: "save",
            revision: settings.revision,
            draft: { "workshop.blog": "Unpublished" },
          })
        ).settings;
        assert.equal(settings.published?.["workshop.blog"], "My blog");
        const previous = (
          await db.query<{ id: string }>(
            "select id from control_settings_versions where key='uz' and snapshot->'draft'->>'workshop.blog'='My blog' limit 1",
          )
        ).rows[0].id;
        settings = (
          await mutation({
            target: "settings",
            key: "uz",
            op: "restore",
            revision: settings.revision,
            versionId: previous,
          })
        ).settings;
        assert.equal(settings.draft["workshop.blog"], "My blog");
        assert.equal(
          (
            await db.query<{ published: unknown }>(
              "select published from control_settings where key='en'",
            )
          ).rows[0].published,
          null,
        );
        settings = (
          await mutation({
            target: "settings",
            key: "uz",
            op: "unpublish",
            revision: settings.revision,
          })
        ).settings;
        assert.equal(settings.published, null);
      },
    );
    await t.test(
      "media deletion protects drafts, publications, history and future references",
      async () => {
        const asset = randomUUID(),
          path = "media/" + asset + ".png";
        await db.query(
          "insert into control_media(id,path,name,mime,size,status,created_by) values($1,$2,'Cover','image/png',12,'ready',$3)",
          [asset, path, actor],
        );
        row = (
          await mutation({
            target: "entry",
            op: "save",
            id,
            revision: row.revision,
            draft: {
              title: "Image draft",
              image:
                "https://psxkpfymzezlcsaasomg.supabase.co/storage/v1/object/public/portfolio-media/" +
                path,
            },
          })
        ).entry;
        assert.equal(
          (
            await db.query<{ value: boolean }>("select control_media_begin_delete($1) as value", [
              asset,
            ])
          ).rows[0].value,
          false,
        );
        row = (
          await mutation({
            target: "entry",
            op: "save",
            id,
            revision: row.revision,
            draft: { title: "No image" },
          })
        ).entry;
        assert.equal(
          (
            await db.query<{ value: boolean }>("select control_media_begin_delete($1) as value", [
              asset,
            ])
          ).rows[0].value,
          false,
        );
        const unused = randomUUID(),
          unusedPath = "media/" + unused + ".png";
        await db.query(
          "insert into control_media(id,path,name,mime,size,status,created_by) values($1,$2,'Unused','image/png',12,'ready',$3)",
          [unused, unusedPath, actor],
        );
        assert.equal(
          (
            await db.query<{ value: boolean }>("select control_media_begin_delete($1) as value", [
              unused,
            ])
          ).rows[0].value,
          true,
        );
        await assert.rejects(
          () =>
            mutation({
              target: "entry",
              op: "save",
              id,
              revision: row.revision,
              draft: { image: unusedPath },
            }),
          /removed/,
        );
      },
    );
    await t.test("private tables and functions reject anon and authenticated roles", async () => {
      for (const role of ["anon", "authenticated"]) {
        await db.exec("reset role; set role " + role);
        for (const table of [
          "control_settings",
          "control_settings_versions",
          "control_requests",
          "control_auth_attempts",
          "control_media",
          "cms_entries",
          "cms_versions",
        ])
          await assert.rejects(() => db.query("select * from " + table), /permission denied/);
        await assert.rejects(
          () => db.query("select control_rate_limit($1)", ["a".repeat(64)]),
          /permission denied/,
        );
        await assert.rejects(
          () => mutation({ target: "entry", op: "save", id, revision: row.revision, draft: {} }),
          /permission denied/,
        );
      }
      await db.exec("reset role; set role service_role");
    });
    await t.test(
      "persistent authentication throttle resets only after the time window",
      async () => {
        const key = "b".repeat(64);
        for (let i = 0; i < 10; i++)
          assert.equal(
            (await db.query<{ value: boolean }>("select control_rate_limit($1) as value", [key]))
              .rows[0].value,
            true,
          );
        assert.equal(
          (await db.query<{ value: boolean }>("select control_rate_limit($1) as value", [key]))
            .rows[0].value,
          false,
        );
        await db.query(
          "update control_auth_attempts set window_start=now()-interval '2 minutes' where key=$1",
          [key],
        );
        assert.equal(
          (await db.query<{ value: boolean }>("select control_rate_limit($1) as value", [key]))
            .rows[0].value,
          true,
        );
      },
    );
  } finally {
    await db.close();
  }
});
