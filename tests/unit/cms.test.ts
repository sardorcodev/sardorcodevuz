import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { validateContent, type AdminEntry, type ContentKind } from "../../src/lib/cms/model";
import { seedEntries } from "../../src/lib/cms/seed";
import { previewToken, verifyPreviewToken, secretMatches } from "../../src/lib/cms/preview-token";
import { planUpdate } from "../../src/lib/telegram/editor";
import {
  isAuthorized,
  type EditorStore,
  type Session,
  type Update,
  type Plan,
} from "../../src/lib/telegram/types";
import { imageType, readLimitedBody } from "../../src/lib/telegram/api";

process.env.CMS_PREVIEW_SECRET = "only-a-local-test-secret-that-is-long-enough";
const user = { id: 123456789 };
let nextUpdate = 100;
function update(text?: string, data?: string): Update {
  return {
    update_id: nextUpdate++,
    ...(data
      ? {
          callback_query: {
            id: "callback",
            from: { ...user },
            data,
            message: { chat: { id: user.id, type: "private" } },
          },
        }
      : { message: { from: { ...user }, chat: { id: user.id, type: "private" }, text } }),
  };
}

test("only the configured user in a private chat is authorized", () => {
  assert.equal(isAuthorized(update("/start"), String(user.id)), true);
  assert.equal(isAuthorized(update("/start"), "1234"), false);
  const group = update("/start");
  group.message!.chat.type = "group";
  assert.equal(isAuthorized(group, String(user.id)), false);
  const spoof = update(undefined, "menu");
  spoof.callback_query!.from.id = 42;
  assert.equal(isAuthorized(spoof, "123456789"), false);
});
test("preview links are bound to entry, revision and a short expiry", () => {
  const id = randomUUID(),
    now = 1791100800000;
  const token = previewToken(id, 3, now);
  assert.equal(verifyPreviewToken(id, token, now), 3);
  assert.equal(verifyPreviewToken(randomUUID(), token, now), null);
  assert.equal(verifyPreviewToken(id, token.replace("3.", "4."), now), null);
  assert.equal(verifyPreviewToken(id, token, now + 1801000), null);
  assert.equal(verifyPreviewToken(id, ""), null);
  assert.equal(secretMatches(null, "secret"), false);
  assert.equal(secretMatches("x", "secret"), false);
  assert.equal(secretMatches("secret", "secret"), true);
});
test("all migrated content is valid and no journal entry is silently published", () => {
  const entries = seedEntries();
  assert.equal(entries.length, 27);
  for (const entry of entries)
    assert.doesNotThrow(() => validateContent(entry.kind, entry.published));
  assert.equal(
    entries.some((e) => e.kind === "post"),
    false,
  );
  assert.equal(
    entries.some((e) => JSON.stringify(e).includes("[object Object]")),
    false,
  );
});
test("unsafe public links, executable images and incomplete articles cannot publish", () => {
  assert.throws(() =>
    validateContent("profile", {
      title: "X",
      summary: "My public account",
      url: "javascript:alert(1)",
      handle: "@test",
      category: "social",
    }),
  );
  assert.throws(() =>
    validateContent("post", {
      title: "A post",
      summary: "A short summary",
      body: "<script>x</script>",
      category: "work",
      image: "data:image/svg+xml,test",
      imageAlt: "test",
    }),
  );
  assert.throws(() => validateContent("post", { title: "A post" }));
  assert.throws(() => imageType(Buffer.from("<svg onload='alert(1)'>")));
});
test("request body limits work even without a Content-Length header", async () => {
  const body = new Request("http://localhost", { method: "POST", body: "123456" });
  await assert.rejects(() => readLimitedBody(body, 5), /BODY_TOO_LARGE/);
});
test("SQL transactions, access isolation and complete editor flows", async (t) => {
  const db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);",
  );
  await db.exec(
    readFileSync("supabase/migrations/20261004181759_portfolio_content_cms.sql", "utf8"),
  );
  const store: EditorStore = {
    async list(kind, locale, offset) {
      return (
        await db.query<AdminEntry>(
          "select * from cms_entries where kind=$1 and locale=$2 order by updated_at desc limit 9 offset $3",
          [kind, locale, offset],
        )
      ).rows;
    },
    async get(id) {
      return (
        (await db.query<AdminEntry>("select * from cms_entries where id=$1", [id])).rows[0] || null
      );
    },
    async find(kind, slug, locale) {
      return (
        (
          await db.query<AdminEntry>(
            "select * from cms_entries where kind=$1 and slug=$2 and locale=$3",
            [kind, slug, locale],
          )
        ).rows[0] || null
      );
    },
    async previous(id) {
      return (
        (
          await db.query<{ draft: Record<string, unknown> | null }>(
            "select cms_previous_draft($1) as draft",
            [id],
          )
        ).rows[0]?.draft || null
      );
    },
  };
  let revision = 0;
  let session: Session = { locale: "uz" };
  async function commit(input: Update, plan: Plan, expected = revision) {
    return (
      await db.query<{ result: { reply: unknown; duplicate: boolean } }>(
        "select cms_commit_update($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb) as result",
        [
          input.update_id,
          123456789,
          expected,
          JSON.stringify(plan.session),
          JSON.stringify(plan.mutation),
          JSON.stringify(plan.reply),
        ],
      )
    ).rows[0].result;
  }
  async function run(text?: string, callback?: string) {
    const input = update(text, callback);
    const plan = await planUpdate(input, session, store);
    await commit(input, plan);
    revision++;
    session = plan.session;
    return { input, plan };
  }
  await t.test("anonymous users cannot read drafts or call the mutation RPC", async () => {
    await db.exec("set role anon");
    await assert.rejects(() => db.query("select * from cms_entries"), /permission denied/);
    await assert.rejects(
      () => db.query("select cms_commit_update(1,1,0,'{}',null,'{}')"),
      /permission denied/,
    );
    await db.exec("reset role");
  });
  await t.test("schema seed is repeatable and preserves an unpublished first draft", async () => {
    const seed = readFileSync("supabase/seed.sql", "utf8");
    await db.exec(seed);
    await db.exec(seed);
    assert.equal(
      (await db.query<{ count: number }>("select count(*)::int as count from cms_entries")).rows[0]
        .count,
      28,
    );
    assert.equal(
      (
        await db.query<{ count: number }>(
          "select count(*)::int as count from cms_entries where kind='post' and published is not null",
        )
      ).rows[0].count,
      0,
    );
  });
  const data: Record<ContentKind, Record<string, string>> = {
    post: {
      title: "Haqiqiy sinov maqolasi",
      summary: "Sinovdagi maqolaning qisqa mazmuni",
      body: "Bu faqat lokal sinov uchun yozilgan maqola matni.",
      category: "work",
    },
    project: {
      title: "Sinov loyihasi",
      summary: "Loyihani batafsil tushuntiruvchi qisqa ta’rif",
      body: "Sinov loyihasi haqida tekshirish uchun yozilgan matn.",
      category: "Full-stack",
      role: "Frontend va backend",
      status: "Sinov",
      stack: "Next.js, TypeScript",
      repository: "https://github.com/sardorcodev/example",
      image: "/images/projects/propaint.webp",
      imageAlt: "Sinovdagi loyiha rasmi",
    },
    profile: {
      title: "X",
      summary: "Mening ijtimoiy tarmoq sahifam",
      url: "https://x.com/sardorcodev",
      handle: "@sardorcodev",
      category: "social",
    },
  };
  for (const kind of ["post", "project", "profile"] as const) {
    await t.test(kind + ": create, edit, preview, publish, translate and unpublish", async () => {
      await run(undefined, "new:" + kind);
      const creation = await run("test-" + kind);
      const id = creation.plan.mutation!.id;
      await run(undefined, "open:" + id);
      for (const [field, value] of Object.entries(data[kind])) {
        await run(undefined, "field:" + id + ":" + field);
        await run(value);
      }
      let entry = (await store.get(id))!;
      assert.equal(entry.published, null);
      const confirmation = await run(undefined, "confirm:" + id + ":publish");
      assert.match(confirmation.plan.reply.text, /Nashr qilinsinmi/);
      const publication = await run(undefined, "publish:" + id + ":" + entry.revision);
      entry = (await store.get(id))!;
      assert.equal(entry.published?.title, data[kind].title);
      const publicationDate = (
        await db.query<{ published_updated_at: Date }>(
          "select published_updated_at from cms_entries where id=$1",
          [id],
        )
      ).rows[0].published_updated_at;
      const previousRevision = entry.revision;
      const replay = await commit(publication.input, publication.plan, -1);
      assert.equal(replay.duplicate, true);
      assert.equal((await store.get(id))!.revision, previousRevision);
      await run(undefined, "field:" + id + ":title");
      await run("Tahrir qilingan qoralama");
      assert.equal((await store.get(id))!.published?.title, data[kind].title);
      assert.deepEqual(
        (
          await db.query<{ published_updated_at: Date }>(
            "select published_updated_at from cms_entries where id=$1",
            [id],
          )
        ).rows[0].published_updated_at,
        publicationDate,
      );
      await run(undefined, "restore:" + id);
      assert.equal((await store.get(id))!.draft.title, data[kind].title);
      // A publication snapshot has the same draft; restoration must skip it.
      entry = (await store.get(id))!;
      await run(undefined, "publish:" + id + ":" + entry.revision);
      assert.notEqual((await store.previous(id))!.title, data[kind].title);
      entry = (await store.get(id))!;
      await run(undefined, "copy:" + id + ":en");
      const translation = (await store.find(kind, "test-" + kind, "en"))!;
      assert.ok(translation);
      assert.equal(translation.published, null);
      await run(undefined, "confirm:" + id + ":unpublish");
      await run(undefined, "unpublish:" + id + ":" + entry.revision);
      assert.equal((await store.get(id))!.published, null);
      assert.equal((await store.get(id))!.draft.title, data[kind].title);
    });
  }
  await t.test("stale session conflicts roll back content and outbox together", async () => {
    const input = update("/menu");
    const plan = await planUpdate(input, session, store);
    await assert.rejects(() => commit(input, plan, 0), /Editor state changed/);
    assert.equal(
      (await db.query("select * from cms_updates where update_id=$1", [input.update_id])).rows
        .length,
      0,
    );
  });
  await t.test("cancelled input cannot alter a previously selected field", async () => {
    const entry = (await store.find("post", "test-post", "uz"))!;
    await run(undefined, "field:" + entry.id + ":title");
    await run("/cancel");
    await run("Should not save");
    assert.equal((await store.get(entry.id))!.draft.title, data.post.title);
  });
  await db.close();
});
