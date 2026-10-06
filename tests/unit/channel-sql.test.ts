import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const migrations = [
  "20261004181759_portfolio_content_cms.sql",
  "20261006065225_telegram_channel_manager.sql",
].map((filename) =>
  readFileSync(new URL("../../supabase/migrations/" + filename, import.meta.url), "utf8"),
);
const owner = 5452614265;
const chatId = -1001234567890;
const postId = "11111111-1111-4111-8111-111111111111";
const otherPostId = "22222222-2222-4222-8222-222222222222";
const token = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherToken = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const draft = { type: "text", text: "Kanal uchun yozuv" };

async function fixture() {
  const db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);",
  );
  for (const migration of migrations) await db.exec(migration);
  await db.exec("set role service_role");
  return db;
}
async function value<T>(db: PGlite, sql: string, parameters: unknown[] = []): Promise<T> {
  return (await db.query<{ value: T }>(sql, parameters)).rows[0].value;
}
async function row(db: PGlite, table: "channel_posts" | "channel_actions", id: string | number) {
  return (
    await db.query<Record<string, unknown>>(
      "select * from " +
        table +
        " where " +
        (table === "channel_posts" ? "id" : "update_id") +
        "=$1",
      [id],
    )
  ).rows[0];
}
async function commit(
  db: PGlite,
  updateId: number,
  mutation: Record<string, unknown> | null,
  revision?: number,
) {
  const current = await db.query<{ revision: number }>(
    "select revision from cms_sessions where user_id=$1",
    [owner],
  );
  return value<{ duplicate: boolean; reply: { text: string } }>(
    db,
    "select channel_commit_update($1,$2,$3,$4,$5,$6) as value",
    [
      updateId,
      owner,
      revision ?? current.rows[0]?.revision ?? 0,
      {},
      mutation,
      { text: "Recorded " + updateId },
    ],
  );
}
const create = (db: PGlite, updateId = 1, id = postId) =>
  commit(db, updateId, { op: "create", id, draft });
async function queue(db: PGlite, updateId: number, action: string, id: string | null = postId) {
  const post = id ? await row(db, "channel_posts", id) : null;
  return commit(db, updateId, {
    op: "queue",
    id,
    ...(post ? { revision: post.revision } : {}),
    action,
    payload: action.startsWith("set_")
      ? { value: "Yangi kanal nomi" }
      : { draft: post?.draft, message_id: post?.message_id },
  });
}
const bind = (db: PGlite, id = chatId) => value(db, "select channel_bind($1) as value", [id]);
const claim = (db: PGlite, updateId: number, claimToken = token) =>
  value<{ claimed: boolean; action: Record<string, unknown> } | null>(
    db,
    "select channel_claim_action($1,$2) as value",
    [updateId, claimToken],
  );
const finish = (
  db: PGlite,
  updateId: number,
  status: string,
  result: unknown = {},
  claimToken = token,
) =>
  value<boolean>(db, "select channel_finish_action($1,$2,$3,$4,$5) as value", [
    updateId,
    claimToken,
    status,
    result,
    status === "succeeded" ? null : "FIXTURE_FAILURE",
  ]);
async function published(db: PGlite) {
  await bind(db);
  await create(db);
  await queue(db, 2, "publish");
  await claim(db, 2);
  await finish(db, 2, "succeeded", { message_id: 123 });
}
const conflict = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "40001";

test("channel tables and RPCs are private while service_role can manage the channel", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  for (const role of ["anon", "authenticated"]) {
    await db.exec("reset role; set role " + role);
    for (const table of ["channel_config", "channel_posts", "channel_actions"]) {
      await assert.rejects(db.query("select * from " + table), /permission denied/);
    }
    for (const sql of [
      "select channel_bind(-100)",
      "select channel_commit_update(1,1,0,'{}',null,'{}')",
      "select channel_claim_action(1,'" + token + "')",
      "select channel_finish_action(1,'" + token + "','failed','{}',null)",
      "select channel_apply_result(1,'{}')",
    ])
      await assert.rejects(db.query(sql), /permission denied/);
  }
  await db.exec("reset role; set role service_role");
  assert.equal((await bind(db)) !== null, true);
  const flags = await db.query<{ relrowsecurity: boolean }>(
    "select relrowsecurity from pg_class where relname=any($1)",
    [["channel_config", "channel_posts", "channel_actions"]],
  );
  assert.equal(flags.rows.length, 3);
  assert.ok(flags.rows.every((r) => r.relrowsecurity));
  const functions = await db.query<{ prosecdef: boolean }>(
    "select prosecdef from pg_proc where proname like 'channel_%'",
  );
  assert.ok(functions.rows.every((r) => !r.prosecdef));
});

test("channel binding pins the first numeric channel identity", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await assert.rejects(bind(db, owner), /Invalid channel chat ID/);
  await bind(db);
  await bind(db);
  await assert.rejects(bind(db, chatId - 1), conflict);
  await assert.rejects(db.query("update channel_config set chat_id=$1", [chatId - 1]), conflict);
  assert.equal(await value(db, "select chat_id as value from channel_config"), chatId);
});

test("stale session or post revisions roll back both the editor reply and mutation", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await bind(db);
  await create(db);
  await assert.rejects(
    commit(db, 2, { op: "save", id: postId, revision: 1, draft: { text: "wrong" } }, 0),
    conflict,
  );
  await assert.rejects(
    commit(db, 3, { op: "save", id: postId, revision: 99, draft: { text: "wrong" } }),
    conflict,
  );
  assert.equal(await value(db, "select count(*)::integer as value from cms_updates"), 1);
  assert.equal(await value(db, "select revision as value from cms_sessions"), 1);
  assert.deepEqual((await row(db, "channel_posts", postId)).draft, draft);
  assert.equal((await row(db, "channel_posts", postId)).revision, 1);
});

test("duplicate Telegram updates return the first reply and queue exactly one immutable action", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await bind(db);
  await create(db);
  const first = await queue(db, 2, "publish");
  const repeated = await commit(db, 2, { op: "create", id: otherPostId, draft: {} }, 99);
  assert.equal(first.duplicate, false);
  assert.equal(repeated.duplicate, true);
  assert.deepEqual(repeated.reply, first.reply);
  assert.equal(await value(db, "select count(*)::integer as value from channel_actions"), 1);
  assert.equal(await row(db, "channel_posts", otherPostId), undefined);
  assert.equal((await row(db, "channel_posts", postId)).revision, 2);
  const action = await row(db, "channel_actions", 2);
  assert.equal(action.chat_id, chatId);
  assert.deepEqual(action.payload, { draft, message_id: null, post_revision: 2 });
  await assert.rejects(
    db.query("update channel_actions set payload='{}' where update_id=2"),
    /immutable/,
  );
  await assert.rejects(
    db.query("update channel_actions set chat_id=$1 where update_id=2", [chatId - 1]),
    /immutable/,
  );
  await assert.rejects(
    commit(db, 3, { op: "queue", id: postId, revision: 1, action: "publish", payload: { draft } }),
    conflict,
  );
  assert.equal(await row(db, "channel_actions", 3), undefined);
});

test("a channel must be bound and each post must finish its action before any further mutation", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await create(db);
  await assert.rejects(queue(db, 2, "publish"), conflict);
  await bind(db);
  await assert.rejects(
    commit(db, 2, {
      op: "queue",
      id: postId,
      revision: 1,
      action: "publish",
      payload: { draft: { text: "Unapproved change" } },
    }),
    conflict,
  );
  await assert.rejects(
    commit(db, 2, {
      op: "queue",
      id: postId,
      revision: 1,
      action: "publish",
      payload: { draft, message_id: 999 },
    }),
    conflict,
  );
  await queue(db, 2, "publish");
  for (const mutation of [
    { op: "save", id: postId, revision: 2, draft },
    { op: "discard", id: postId, revision: 2 },
    { op: "queue", id: postId, revision: 2, action: "publish", payload: { draft } },
  ])
    await assert.rejects(commit(db, 3, mutation), conflict);
  assert.equal(await value(db, "select count(*)::integer as value from cms_updates"), 2);
});

test("claim ownership cannot be stolen and an expired sending lease becomes uncertain without resending", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await bind(db);
  await create(db);
  await queue(db, 2, "publish");
  assert.equal(await claim(db, 999), null);
  assert.equal((await claim(db, 2))?.claimed, true);
  const competing = await claim(db, 2, otherToken);
  assert.equal(competing?.claimed, false);
  assert.equal(competing?.action.claim_token, token);
  assert.equal(await finish(db, 2, "succeeded", { message_id: 99 }, otherToken), false);
  await db.query(
    "update channel_actions set started_at=now()-interval '91 seconds' where update_id=2",
  );
  const expired = await claim(db, 2, otherToken);
  assert.equal(expired?.claimed, false);
  assert.equal(expired?.action.status, "uncertain");
  assert.equal(expired?.action.claim_token, token);
  assert.equal(await finish(db, 2, "succeeded", { message_id: 99 }), false);
  assert.equal((await claim(db, 2))?.claimed, false);
  assert.equal((await row(db, "channel_posts", postId)).status, "draft");
});

test("successful publish edit pin unpin and delete apply the confirmed snapshots once", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await published(db);
  let post = await row(db, "channel_posts", postId);
  assert.equal(post.status, "published");
  assert.equal(post.message_id, 123);
  assert.equal(post.revision, 3);
  assert.deepEqual(post.published, draft);
  assert.ok(post.published_at);
  assert.equal(await finish(db, 2, "succeeded", { message_id: 999 }), false);
  const edited = { ...draft, text: "Tahrirlangan yozuv" };
  await commit(db, 3, { op: "save", id: postId, revision: post.revision, draft: edited });
  await queue(db, 4, "edit");
  await claim(db, 4);
  await finish(db, 4, "succeeded");
  post = await row(db, "channel_posts", postId);
  assert.deepEqual(post.published, edited);
  for (const [updateId, action, expected] of [
    [5, "pin", true],
    [6, "unpin", false],
  ] as const) {
    await queue(db, updateId, action);
    await claim(db, updateId);
    await finish(db, updateId, "succeeded");
    assert.equal((await row(db, "channel_posts", postId)).pinned, expected);
  }
  await assert.rejects(
    commit(db, 7, {
      op: "discard",
      id: postId,
      revision: (await row(db, "channel_posts", postId)).revision,
    }),
    conflict,
  );
  await queue(db, 7, "delete");
  await claim(db, 7);
  await finish(db, 7, "succeeded");
  assert.equal((await row(db, "channel_posts", postId)).status, "deleted");
  await assert.rejects(queue(db, 8, "publish"), conflict);
});

test("known failures preserve post state and release its lock without retrying the same action", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await bind(db);
  await create(db);
  await queue(db, 2, "publish");
  await claim(db, 2);
  assert.equal(await finish(db, 2, "failed"), true);
  assert.equal((await row(db, "channel_posts", postId)).status, "draft");
  assert.equal((await row(db, "channel_posts", postId)).published, null);
  assert.equal((await claim(db, 2))?.claimed, false);
  await queue(db, 3, "publish");
  assert.equal((await claim(db, 3))?.claimed, true);
});

test("invalid successful publication rolls back its outcome and keeps the sending action reserved", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await bind(db);
  await create(db);
  await queue(db, 2, "publish");
  await claim(db, 2);
  await assert.rejects(finish(db, 2, "succeeded", {}), /requires a message ID/);
  assert.equal((await row(db, "channel_actions", 2)).status, "sending");
  assert.equal((await row(db, "channel_posts", postId)).message_id, null);
  assert.equal(await finish(db, 2, "succeeded", { message_id: 321 }), true);
});

test("only uncertain or expired actions can be manually reconciled against the same post revision", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await bind(db);
  await create(db);
  await queue(db, 2, "publish");
  await claim(db, 2);
  const resolution = {
    op: "reconcile",
    id: postId,
    revision: 2,
    action_update_id: 2,
    resolution: "succeeded",
    message_id: 456,
  };
  await assert.rejects(commit(db, 3, resolution), conflict);
  await finish(db, 2, "uncertain");
  await assert.rejects(commit(db, 3, { ...resolution, id: otherPostId }), conflict);
  await assert.rejects(commit(db, 3, { ...resolution, revision: 99 }), conflict);
  await assert.rejects(commit(db, 3, { ...resolution, message_id: 0 }), /requires a message ID/);
  assert.equal(await row(db, "channel_actions", 3), undefined);
  assert.equal(await value(db, "select count(*)::integer as value from cms_updates"), 2);
  await commit(db, 3, resolution);
  assert.equal((await row(db, "channel_actions", 2)).status, "succeeded");
  assert.deepEqual((await row(db, "channel_actions", 2)).result, { manual: true, message_id: 456 });
  assert.equal((await row(db, "channel_posts", postId)).message_id, 456);
  assert.equal((await commit(db, 3, resolution)).duplicate, true);
  await assert.rejects(commit(db, 4, { ...resolution, revision: 3 }), conflict);
});

test("manual failure on an expired sending action releases the lock for a new owner-confirmed action", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await bind(db);
  await create(db);
  await queue(db, 2, "publish");
  await claim(db, 2);
  await db.query(
    "update channel_actions set started_at=now()-interval '91 seconds' where update_id=2",
  );
  await commit(db, 3, {
    op: "reconcile",
    id: postId,
    revision: 2,
    action_update_id: 2,
    resolution: "failed",
  });
  assert.equal((await row(db, "channel_posts", postId)).status, "draft");
  assert.equal((await row(db, "channel_actions", 2)).status, "failed");
  assert.equal(await finish(db, 2, "succeeded", { message_id: 123 }), false);
  await queue(db, 4, "publish");
  assert.equal((await claim(db, 4))?.claimed, true);
});

test("settings actions use only the bound channel and also reserve uncertain outcomes", async (t) => {
  const db = await fixture();
  t.after(() => db.close());
  await bind(db);
  await queue(db, 1, "set_title", null);
  await assert.rejects(queue(db, 2, "set_title", null), conflict);
  await claim(db, 1);
  await finish(db, 1, "uncertain");
  await assert.rejects(queue(db, 2, "set_title", null), conflict);
  await commit(db, 2, { op: "reconcile", action_update_id: 1, resolution: "succeeded" });
  assert.equal((await row(db, "channel_actions", 1)).chat_id, chatId);
  assert.equal((await row(db, "channel_actions", 1)).post_id, null);
  await queue(db, 3, "set_description", null);
  await claim(db, 3);
  assert.equal(await finish(db, 3, "succeeded"), true);
  await assert.rejects(
    commit(db, 4, { op: "queue", action: "sendMessage", payload: {} }),
    /Invalid channel action/,
  );
  assert.equal(await value(db, "select count(*)::integer as value from channel_posts"), 0);
});
