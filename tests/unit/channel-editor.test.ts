import { test } from "node:test";
import assert from "node:assert/strict";
import { planChannelUpdate } from "../../src/lib/telegram/channel-editor";
import {
  channelDraftSchema,
  draftFromMessage,
  parseChannelButtons,
  type ChannelAction,
  type ChannelPlan,
  type ChannelPost,
  type ChannelStatus,
  type ChannelStore,
} from "../../src/lib/telegram/channel-model";
import type { EditorStore, Session, Update } from "../../src/lib/telegram/types";

const owner = 5452614265;
const chatId = -1001234567890;
const postId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const base: Session = { locale: "uz" };
let nextUpdate = 1000;

function update(text?: string, callback?: string): Update {
  return {
    update_id: nextUpdate++,
    ...(callback
      ? {
          callback_query: {
            id: "callback",
            from: { id: owner },
            data: callback,
            message: { chat: { id: owner, type: "private" } },
          },
        }
      : { message: { from: { id: owner }, chat: { id: owner, type: "private" }, text } }),
  };
}
function post(id = postId, revision = 7): ChannelPost {
  return {
    id,
    revision,
    draft: channelDraftSchema.parse({ type: "text", text: "Workshop update 🌱" }),
    published: null,
    message_id: null,
    status: "draft",
    pinned: false,
    published_at: null,
    updated_at: new Date().toISOString(),
    last_action_id: null,
  };
}
function settingAction(updateId: number, kind: "set_title" | "set_description"): ChannelAction {
  return {
    update_id: updateId,
    post_id: null,
    kind,
    payload: { value: "Requested setting " + updateId },
    chat_id: chatId,
    status: "uncertain",
    claim_token: null,
    started_at: null,
    error_code: "connection",
    result: null,
  };
}
function fixture(initialPosts: ChannelPost[] = [], initialActions: ChannelAction[] = []) {
  const posts = new Map(initialPosts.map((entry) => [entry.id, entry]));
  const actions = new Map(initialActions.map((entry) => [entry.update_id, entry]));
  const status: ChannelStatus = {
    chatId,
    title: "sardorcodev",
    description: "My workshop",
    members: 25,
    permissions: { post: true, edit: true, delete: true, info: true },
  };
  let statusChecks = 0;
  const store: ChannelStore = {
    async list(offset) {
      return [...posts.values()].slice(offset, offset + 9);
    },
    async get(id) {
      return posts.get(id) || null;
    },
    async action(id) {
      return actions.get(id) || null;
    },
    async status() {
      statusChecks++;
      return status;
    },
    async unfinishedSettings() {
      return [...actions.values()].filter(
        (action) =>
          action.post_id === null && ["pending", "sending", "uncertain"].includes(action.status),
      );
    },
  };
  const cms: EditorStore = {
    async list() {
      return [];
    },
    async get() {
      return null;
    },
    async find() {
      return null;
    },
    async previous() {
      return null;
    },
  };
  async function plan(input: Update, session = base): Promise<ChannelPlan> {
    const result = await planChannelUpdate(input, session, store, cms);
    assert.ok(result, "The channel planner handles this update");
    return result;
  }
  return { posts, actions, status, plan, statusChecks: () => statusChecks };
}
function callbacks(plan: ChannelPlan) {
  return (plan.reply.reply_markup?.inline_keyboard.flat() || [])
    .map((button) => button.callback_data)
    .filter((value): value is string => typeof value === "string");
}
function callback(plan: ChannelPlan, prefix: string) {
  const found = callbacks(plan).find((value) => value.startsWith(prefix));
  assert.ok(found, "Expected callback starting with " + prefix);
  return found;
}
async function settingConfirmation(f: ReturnType<typeof fixture>, value: string, kind = "title") {
  const opened = await f.plan(update(undefined, "ch:" + kind));
  return f.plan(update(value), opened.session);
}

test("stale settings confirmation cannot queue a newer value; the current nonce queues it", async () => {
  const f = fixture();
  const first = await settingConfirmation(f, "Title A");
  const current = await settingConfirmation(f, "Title B");
  const oldButton = callback(first, "ch:setting:confirm:");
  const currentButton = callback(current, "ch:setting:confirm:");
  assert.notEqual(oldButton, currentButton);
  const stale = await f.plan(update(undefined, oldButton), current.session);
  assert.equal(stale.channelMutation, undefined);
  assert.equal(stale.session.channel?.confirmation?.value, "Title B");
  const confirmed = await f.plan(update(undefined, currentButton), current.session);
  assert.deepEqual(confirmed.channelMutation, {
    op: "queue",
    id: null,
    action: "set_title",
    payload: { value: "Title B" },
  });
  assert.equal(confirmed.mutation, null);
});

test("expired settings confirmations and revoked permissions do not queue changes", async () => {
  const f = fixture();
  const current = await settingConfirmation(f, "Description B", "description");
  const data = callback(current, "ch:setting:confirm:");
  const expired = await f.plan(update(undefined, data), { ...current.session, expires: 1 });
  assert.equal(expired.channelMutation, undefined);
  f.status.permissions.info = false;
  assert.equal((await f.plan(update(undefined, data), current.session)).channelMutation, undefined);
});

test("unfinished settings remain reachable from both menus and block a competing change", async () => {
  const action = settingAction(100, "set_title");
  const f = fixture([], [action]);
  for (const menu of ["ch:menu", "ch:settings"]) {
    const opened = await f.plan(update(undefined, menu));
    assert.ok(callbacks(opened).includes("ch:resolve-settings:100"));
  }
  const blocked = await f.plan(update(undefined, "ch:title"));
  assert.equal(blocked.channelMutation, undefined);
  assert.notEqual(blocked.session.channel?.mode, "settings-title");
  const independent = await f.plan(update(undefined, "ch:description"));
  assert.equal(independent.session.channel?.mode, "settings-description");
});

test("an unfinished action appearing after settings preview prevents confirmation", async () => {
  const f = fixture();
  const current = await settingConfirmation(f, "Title A");
  f.actions.set(100, settingAction(100, "set_title"));
  const result = await f.plan(
    update(undefined, callback(current, "ch:setting:confirm:")),
    current.session,
  );
  assert.equal(result.channelMutation, undefined);
});

test("old reconciliation yes/no/commit buttons cannot resolve a newer action", async () => {
  const f = fixture([], [settingAction(100, "set_title"), settingAction(200, "set_description")]);
  const old = await f.plan(update(undefined, "ch:resolve-settings:100"));
  const oldYes = callback(old, "ch:reconcile:yes:");
  const oldNo = callback(old, "ch:reconcile:no:");
  const oldDecision = await f.plan(update(undefined, oldYes), old.session);
  const oldCommit = callback(oldDecision, "ch:reconcile:commit:");
  const current = await f.plan(update(undefined, "ch:resolve-settings:200"));
  for (const staleButton of [oldYes, oldNo, oldCommit]) {
    const stale = await f.plan(update(undefined, staleButton), current.session);
    assert.equal(stale.channelMutation, undefined);
    assert.equal(stale.session.channel?.reconcileUpdateId, 200);
    assert.equal(stale.session.channel?.resolution, undefined);
  }
  const currentDecision = await f.plan(
    update(undefined, callback(current, "ch:reconcile:no:")),
    current.session,
  );
  const staleCommit = await f.plan(update(undefined, oldCommit), currentDecision.session);
  assert.equal(staleCommit.channelMutation, undefined);
  assert.equal(staleCommit.session.channel?.resolution, "failed");
  const committed = await f.plan(
    update(undefined, callback(currentDecision, "ch:reconcile:commit:")),
    currentDecision.session,
  );
  assert.deepEqual(committed.channelMutation, {
    op: "reconcile",
    action_update_id: 200,
    resolution: "failed",
  });
});

test("post publication requires matching target, revision, active confirmation and permission", async () => {
  const first = post();
  const second = post(otherId);
  const f = fixture([first, second]);
  const confirmation = await f.plan(update(undefined, "ch:confirm:p:" + postId));
  assert.equal(confirmation.channelMutation, undefined);
  assert.equal(f.statusChecks(), 1, "First publication checks and binds the target channel");
  const data = callback(confirmation, "ch:do:p:");
  assert.equal((await f.plan(update(undefined, data), base)).channelMutation, undefined);
  assert.equal(
    (await f.plan(update(undefined, data), { ...confirmation.session, expires: 1 }))
      .channelMutation,
    undefined,
  );
  assert.equal(
    (await f.plan(update(undefined, data.replace(postId, otherId)), confirmation.session))
      .channelMutation,
    undefined,
  );
  first.revision++;
  assert.equal(
    (await f.plan(update(undefined, data), confirmation.session)).channelMutation,
    undefined,
  );
  first.revision--;
  const valid = await f.plan(update(undefined, data), confirmation.session);
  assert.deepEqual(valid.channelMutation, {
    op: "queue",
    id: postId,
    revision: first.revision,
    action: "publish",
    payload: { draft: first.draft },
  });
  f.status.permissions.post = false;
  assert.equal(
    (await f.plan(update(undefined, "ch:confirm:p:" + postId))).channelMutation,
    undefined,
  );
  assert.equal(
    (await f.plan(update(undefined, "ch:confirm:p:" + postId))).session.channel?.confirmation,
    undefined,
  );
});

test("post and nonce confirmation callbacks stay within Telegram's 64-byte limit", async () => {
  const f = fixture([post(postId, 2147483647)], [settingAction(100, "set_title")]);
  const plans = [
    await f.plan(update(undefined, "ch:menu")),
    await f.plan(update(undefined, "ch:settings")),
    await f.plan(update(undefined, "ch:open:" + postId)),
    await f.plan(update(undefined, "ch:confirm:p:" + postId)),
    await f.plan(update(undefined, "ch:resolve-settings:100")),
    await settingConfirmation(f, "New description", "description"),
  ];
  const reconcile = plans[4];
  plans.push(
    await f.plan(update(undefined, callback(reconcile, "ch:reconcile:yes:")), reconcile.session),
  );
  const values = plans.flatMap(callbacks);
  assert.ok(values.some((value) => value.endsWith(":" + 2147483647)));
  assert.ok(values.some((value) => value.startsWith("ch:setting:confirm:")));
  assert.ok(values.some((value) => value.startsWith("ch:reconcile:commit:")));
  for (const value of values) assert.ok(Buffer.byteLength(value, "utf8") <= 64, value);
});

test("UTF-16 formatting positions survive emoji and reject out-of-range entities", () => {
  const input = update("A🌱B");
  input.message!.entities = [{ type: "bold", offset: 1, length: 2 }];
  const parsed = draftFromMessage(input);
  assert.equal(parsed.text.length, 4);
  assert.deepEqual(parsed.entities, input.message!.entities);
  input.message!.entities = [{ type: "bold", offset: 3, length: 2 }];
  assert.throws(() => draftFromMessage(input));
  assert.throws(() =>
    channelDraftSchema.parse({
      type: "text",
      text: "A🌱B",
      entities: [{ type: "bold", offset: -1, length: 1 }],
    }),
  );
});

test("text and media caption limits prevent oversized drafts without truncating formatting", () => {
  assert.doesNotThrow(() => channelDraftSchema.parse({ type: "text", text: "a".repeat(4096) }));
  assert.throws(() => channelDraftSchema.parse({ type: "text", text: "a".repeat(4097) }));
  for (const type of ["photo", "video", "document"]) {
    assert.doesNotThrow(() =>
      channelDraftSchema.parse({ type, file_id: "received-file-id", text: "a".repeat(1024) }),
    );
    assert.throws(() =>
      channelDraftSchema.parse({ type, file_id: "received-file-id", text: "a".repeat(1025) }),
    );
    assert.throws(() => channelDraftSchema.parse({ type, text: "caption" }));
  }
});

test("albums and oversized media never create partial channel drafts", async () => {
  const input = update();
  input.message!.photo = [{ file_id: "photo-id", file_size: 500 }];
  input.message!.caption = "Album caption";
  input.message!.media_group_id = "album-id";
  assert.throws(() => draftFromMessage(input), /Albom/);
  const f = fixture();
  const result = await f.plan(input, {
    locale: "uz",
    channel: { mode: "new" },
    expires: Date.now() + 60000,
  });
  assert.equal(result.channelMutation, undefined);
  delete input.message!.media_group_id;
  input.message!.photo[0].file_size = 10485761;
  assert.throws(() => draftFromMessage(input), /10 MB/);
  delete input.message!.photo;
  input.message!.video = { file_id: "video-id", file_size: 52428801 };
  assert.throws(() => draftFromMessage(input), /50 MB/);
});

test("URL buttons accept valid HTTPS destinations and reject unsafe links or excess buttons", () => {
  assert.deepEqual(
    parseChannelButtons(
      "Portfolio | https://sardorcodev.uz\nGitHub | https://github.com/sardorcodev",
    ),
    [
      { text: "Portfolio", url: "https://sardorcodev.uz" },
      { text: "GitHub", url: "https://github.com/sardorcodev" },
    ],
  );
  assert.deepEqual(parseChannelButtons("-"), []);
  for (const value of [
    "Run | javascript:alert(1)",
    "Website | http://example.com",
    "Website | https://username:password@example.com",
    "Missing separator",
    " | https://example.com",
    Array.from({ length: 7 }, (_, i) => "Button " + i + " | https://example.com").join("\n"),
  ])
    assert.throws(() => parseChannelButtons(value), value);
});
