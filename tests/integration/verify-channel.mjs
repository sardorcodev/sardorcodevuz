import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// Real HTTP handlers and SQL migrations run here; every Telegram and Supabase
// request is intercepted inside the child process before it can use the network.
const root = process.cwd();
const temporary = mkdtempSync(join(root, "node_modules/.sardor-channel-flow-"));
const build = join(root, ".next");
const backup = join(temporary, "original-next");
const hadBuild = existsSync(build);
const skipBuild = process.argv.includes("--skip-build");
const origin = "http://127.0.0.1:3114";
const controlOrigin = "http://127.0.0.1:3115";
const secret = "local_channel_verification_secret_123456789";
const controlSecret = randomUUID();
const env = {
  ...process.env,
  SUPABASE_URL: "https://psxkpfymzezlcsaasomg.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "local-verification-key-never-sent-to-supabase",
  TELEGRAM_BOT_TOKEN: "123:local_verification_token",
  TELEGRAM_ADMIN_USER_ID: "123456789",
  TELEGRAM_WEBHOOK_SECRET: secret,
  TELEGRAM_CHANNEL_USERNAME: "sardorcodev",
  CMS_PREVIEW_SECRET: "local-verification-preview-secret-123456789",
  CMS_VERIFY_ROOT: root,
  CMS_VERIFY_REPLY: join(temporary, "reply.json"),
  CMS_VERIFY_CONTROL_PORT: "3115",
  CMS_VERIFY_CONTROL_SECRET: controlSecret,
  NODE_OPTIONS:
    (process.env.NODE_OPTIONS || "") + " --require=" + resolve("tests/integration/provider.cjs"),
  NEXT_TELEMETRY_DISABLED: "1",
  VERCEL_ENV: "production",
};
const user = { id: 123456789 };
const chat = { id: user.id, type: "private" };
let updateId = 910000;
let server;
let backedUp = false;
function child(args) {
  return spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), ...args], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
}
function completed(process) {
  return new Promise((resolve, reject) => {
    let output = "";
    for (const stream of [process.stdout, process.stderr])
      stream.on("data", (chunk) => (output = (output + chunk.toString()).slice(-9000)));
    process.on("error", reject);
    process.on("close", (code, signal) =>
      code === 0
        ? resolve()
        : reject(new Error("Next command failed (" + (signal || code) + "): " + output)),
    );
  });
}
async function control(body) {
  const response = await fetch(controlOrigin + "/__verification", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-verification-secret": controlSecret },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 200, await response.clone().text());
  return response.json();
}
const inspect = () => control({ action: "inspect" });
async function webhook(input, expected = [200]) {
  const response = await fetch(origin + "/api/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": secret },
    body: JSON.stringify(input),
  });
  assert.ok(
    expected.includes(response.status),
    "Webhook " + response.status + ": " + (await response.text()),
  );
  return {
    input,
    reply: existsSync(env.CMS_VERIFY_REPLY)
      ? JSON.parse(readFileSync(env.CMS_VERIFY_REPLY, "utf8"))
      : null,
  };
}
function send(text, callback, id = updateId++, extra = {}) {
  return webhook({
    update_id: id,
    ...(callback
      ? { callback_query: { id: "callback-" + id, from: user, data: callback, message: { chat } } }
      : { message: { from: user, chat, text, ...extra } }),
  });
}
const buttons = (reply) => reply?.reply_markup?.inline_keyboard.flat() || [];
const publicCalls = (state, method) =>
  state.calls.filter((call) => call.public && (!method || call.method === method));
function postId(reply) {
  const open = buttons(reply).find((button) => button.callback_data?.startsWith("ch:open:"));
  assert.ok(open, "Created channel draft has an open button");
  return open.callback_data.slice("ch:open:".length);
}
async function draft(text, extra) {
  await send(undefined, "ch:new");
  return postId((await send(text, undefined, undefined, extra)).reply);
}
async function confirmation(id, operation) {
  const reply = (await send(undefined, "ch:confirm:" + operation + ":" + id)).reply;
  const button = buttons(reply).find((button) =>
    button.callback_data?.startsWith("ch:do:" + operation + ":" + id + ":"),
  );
  assert.ok(button, "Owner confirmation required for operation " + operation);
  return button.callback_data;
}
async function action(id, operation) {
  return send(undefined, await confirmation(id, operation));
}
function actionRow(state, id) {
  const row = state.rows.channel_actions.find((row) => String(row.update_id) === String(id));
  assert.ok(row, "Channel action recorded atomically for update " + id);
  return row;
}
function postRow(state, id) {
  const row = state.rows.channel_posts.find((row) => row.id === id);
  assert.ok(row);
  return row;
}
try {
  if (!skipBuild && hadBuild) {
    renameSync(build, backup);
    backedUp = true;
  }
  if (!skipBuild) {
    console.log("Building channel manager against an isolated PostgreSQL/Telegram provider.");
    await completed(child(["build", ...(process.argv.includes("--webpack") ? ["--webpack"] : [])]));
  } else assert.ok(hadBuild, "--skip-build requires an existing production build");
  server = child(["start", "--hostname", "127.0.0.1", "--port", "3114"]);
  let serverError = "";
  server.stderr.on(
    "data",
    (chunk) => (serverError = (serverError + chunk.toString()).slice(-5000)),
  );
  server.stdout.on("data", () => {});
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(origin + "/uz")).status === 200) {
        await inspect();
        ready = true;
        break;
      }
    } catch {}
    await delay(200);
  }
  assert.ok(ready, "Integration server failed to start: " + serverError);
  assert.equal((await fetch(controlOrigin + "/__verification", { method: "POST" })).status, 401);
  assert.equal((await fetch(origin + "/api/telegram", { method: "POST", body: "{}" })).status, 401);
  for (const source of [
    { from: { id: 42 }, chat: { id: 42, type: "private" }, text: "/channel" },
    { from: user, chat: { id: -123, type: "group" }, text: "/channel" },
  ])
    await webhook({ update_id: updateId++, message: source });
  await webhook({
    update_id: updateId++,
    callback_query: {
      id: "unauthorized",
      from: { id: 42 },
      data: "ch:new",
      message: { chat: { id: 42, type: "private" } },
    },
  });
  assert.equal(
    (await inspect()).calls.length,
    0,
    "Unauthorized/group commands perform no Telegram actions",
  );

  await send("/channel");
  const initial = await inspect();
  assert.equal(String(initial.rows.channel_config[0].chat_id), "-1001234567890");
  const original = "Hello 🌱 workshop";
  const entities = [
    { type: "bold", offset: 0, length: 5 },
    { type: "italic", offset: 9, length: 8 },
  ];
  const id = await draft(original, { entities });
  await send(undefined, "ch:preview:" + id);
  assert.equal(publicCalls(await inspect()).length, 0, "Draft creation/preview never publish");
  await send(undefined, "ch:buttons:" + id);
  await send("Portfolio | https://sardorcodev.uz\nGitHub | https://github.com/sardorcodev");
  await send(undefined, "ch:silent:" + id);
  await send(undefined, "ch:links:" + id);
  const publishCallback = await confirmation(id, "p");
  assert.equal(publicCalls(await inspect()).length, 0, "Confirmation prompt never publishes");
  const publication = await send(undefined, publishCallback);
  let state = await inspect();
  assert.equal(publicCalls(state, "sendMessage").length, 1);
  const outgoing = publicCalls(state, "sendMessage")[0].body;
  assert.equal(String(outgoing.chat_id), "-1001234567890");
  assert.equal(outgoing.text, original);
  assert.deepEqual(outgoing.entities, entities, "UTF-16 entity offsets preserved exactly");
  assert.equal(outgoing.disable_notification, true);
  assert.equal(outgoing.link_preview_options.is_disabled, true);
  assert.ok(
    outgoing.reply_markup.inline_keyboard
      .flat()
      .some((button) => button.url === "https://sardorcodev.uz"),
  );
  assert.equal(postRow(state, id).status, "published");
  assert.equal(actionRow(state, publication.input.update_id).status, "succeeded");
  await webhook(publication.input);
  await send(undefined, publishCallback);
  assert.equal(
    publicCalls(await inspect(), "sendMessage").length,
    1,
    "Replayed update and stale callback cannot publish twice",
  );
  await webhook({
    update_id: updateId++,
    callback_query: {
      id: "owner-group",
      from: user,
      data: publishCallback,
      message: { chat: { id: -123, type: "supergroup" } },
    },
  });
  assert.equal(
    publicCalls(await inspect(), "sendMessage").length,
    1,
    "Owner callback in a group is rejected",
  );

  await send(undefined, "ch:text:" + id);
  await send("Updated workshop post", undefined, undefined, {
    entities: [{ type: "bold", offset: 0, length: 7 }],
  });
  const staleEdit = await confirmation(id, "e");
  await send(undefined, "ch:text:" + id);
  await send("Updated workshop post", undefined, undefined, {
    entities: [{ type: "bold", offset: 0, length: 7 }],
  });
  await send(undefined, staleEdit);
  assert.equal(
    publicCalls(await inspect(), "editMessageText").length,
    0,
    "A changed draft invalidates the previous confirmation",
  );
  await action(id, "e");
  state = await inspect();
  assert.equal(publicCalls(state, "editMessageText").length, 1);
  assert.equal(publicCalls(state, "editMessageText")[0].body.text, "Updated workshop post");
  await action(id, "i");
  await action(id, "u");
  await action(id, "d");
  state = await inspect();
  for (const method of ["pinChatMessage", "unpinChatMessage", "deleteMessage"])
    assert.equal(publicCalls(state, method).length, 1);
  assert.equal(postRow(state, id).status, "deleted");
  console.log(
    "Owner authorization, confirmation, text entities/buttons, durable publication, replay, edit/pin/unpin/delete verified.",
  );

  const photoId = await draft(undefined, {
    photo: [{ file_id: "local-photo-file-id", file_size: 400 }],
    caption: "Photo caption",
    caption_entities: [{ type: "bold", offset: 0, length: 5 }],
  });
  await send(undefined, "ch:preview:" + photoId);
  state = await inspect();
  assert.ok(
    state.calls.some(
      (call) =>
        !call.public && call.method === "sendPhoto" && call.body.photo === "local-photo-file-id",
    ),
  );
  await action(photoId, "p");
  state = await inspect();
  assert.equal(publicCalls(state, "sendPhoto").length, 1);
  assert.equal(publicCalls(state, "sendPhoto")[0].body.photo, "local-photo-file-id");
  assert.deepEqual(publicCalls(state, "sendPhoto")[0].body.caption_entities, [
    { type: "bold", offset: 0, length: 5 },
  ]);
  await send(undefined, "ch:text:" + photoId);
  await send("Updated photo caption");
  await action(photoId, "e");
  assert.equal(publicCalls(await inspect(), "editMessageMedia").length, 1);
  assert.equal(
    publicCalls(await inspect(), "editMessageMedia")[0].body.media.caption,
    "Updated photo caption",
  );
  await send(undefined, "ch:replace:" + photoId);
  await send(undefined, undefined, undefined, {
    photo: [{ file_id: "local-replacement-photo", file_size: 400 }],
    caption: "Replacement photo",
  });
  await action(photoId, "e");
  assert.equal(
    publicCalls(await inspect(), "editMessageMedia")[1].body.media.media,
    "local-replacement-photo",
  );
  for (const [kind, method] of [
    ["video", "sendVideo"],
    ["document", "sendDocument"],
  ]) {
    const mediaId = await draft(undefined, {
      [kind]: { file_id: "local-" + kind + "-file-id", file_size: 200 },
      caption: kind + " caption",
    });
    await action(mediaId, "p");
    assert.equal(publicCalls(await inspect(), method).length, 1);
  }
  console.log(
    "Private media previews, photo/video/document file IDs and caption editing verified.",
  );

  for (const [callback, value, method, field] of [
    ["ch:title", "Updated local workshop", "setChatTitle", "title"],
    ["ch:description", "Updated local channel description", "setChatDescription", "description"],
  ]) {
    await send(undefined, callback);
    const setting = (await send(value)).reply;
    assert.equal(
      publicCalls(await inspect(), method).length,
      0,
      "Channel metadata needs a separate confirmation",
    );
    const confirmSetting = buttons(setting).find((button) =>
      button.callback_data?.startsWith("ch:setting:confirm:"),
    );
    assert.ok(confirmSetting);
    await send(undefined, confirmSetting.callback_data);
    assert.equal(publicCalls(await inspect(), method)[0].body[field], value);
  }
  const beforeInvalid = (await inspect()).rows.channel_posts.length;
  await send(undefined, "ch:new");
  const album = await send(undefined, undefined, undefined, {
    media_group_id: "local-album",
    photo: [{ file_id: "album-photo", file_size: 100 }],
  });
  assert.match(album.reply.text, /albom/i);
  assert.equal(
    (await inspect()).rows.channel_posts.length,
    beforeInvalid,
    "Albums cannot create a partial channel draft",
  );
  await send("bad entity", undefined, undefined, {
    entities: [{ type: "bold", offset: 50, length: 4 }],
  });
  assert.equal(
    (await inspect()).rows.channel_posts.length,
    beforeInvalid,
    "Invalid entity boundaries cannot create a draft",
  );
  await send("/cancel");
  console.log(
    "Channel title/description confirmations, album rejection and entity boundary validation verified.",
  );

  await send(undefined, "new:post");
  const cmsCreated = (await send("channel-blog-integration")).reply;
  const cmsOpen = buttons(cmsCreated).find((button) => button.callback_data?.startsWith("open:"));
  assert.ok(cmsOpen);
  const cmsId = cmsOpen.callback_data.slice("open:".length);
  for (const [field, value] of Object.entries({
    title: "Blog to channel integration",
    summary: "Local published article used for channel drafting.",
    body: "## Article\n\nA published article that must need channel confirmation.",
    category: "learning",
  })) {
    await send(undefined, "field:" + cmsId + ":" + field);
    await send(value);
  }
  const beforeBlogDraft = (await inspect()).rows.channel_posts.length;
  await send(undefined, "ch:blog:" + cmsId);
  assert.equal(
    (await inspect()).rows.channel_posts.length,
    beforeBlogDraft,
    "Unpublished blog drafts cannot become channel posts",
  );
  const cmsConfirmation = (await send(undefined, "confirm:" + cmsId + ":publish")).reply;
  const cmsPublish = buttons(cmsConfirmation).find((button) =>
    button.callback_data?.startsWith("publish:"),
  );
  assert.ok(cmsPublish);
  await send(undefined, cmsPublish.callback_data);
  const beforeBlog = publicCalls(await inspect()).length;
  const blogDraft = postId((await send(undefined, "ch:blog:" + cmsId)).reply);
  assert.match(postRow(await inspect(), blogDraft).draft.text, /Blog to channel integration/);
  assert.equal(
    publicCalls(await inspect()).length,
    beforeBlog,
    "Published blog becomes a draft without automatic channel publication",
  );
  console.log("Existing CMS publication and separately confirmed blog-to-channel draft verified.");

  const deniedId = await draft("This must not publish after permission loss");
  const deniedCallback = await confirmation(deniedId, "p");
  const beforeDenied = publicCalls(await inspect()).length;
  await control({ action: "configure", botRights: { can_post_messages: false } });
  const denied = await send(undefined, deniedCallback);
  state = await inspect();
  assert.equal(
    publicCalls(state).length,
    beforeDenied,
    "Permission is checked again before public send",
  );
  assert.equal(actionRow(state, denied.input.update_id).status, "failed");
  await control({ action: "configure", botRights: {} });
  await webhook(denied.input);
  assert.equal(
    publicCalls(await inspect()).length,
    beforeDenied,
    "Restoring permission does not replay failed action",
  );

  const timeoutId = await draft("Uncertain network delivery must not resend");
  const timeoutCallback = await confirmation(timeoutId, "p");
  const beforeTimeout = publicCalls(await inspect(), "sendMessage").length;
  await control({ action: "configure", failure: { kind: "timeout", method: "sendMessage" } });
  const timeoutInput = {
    update_id: updateId++,
    callback_query: { id: "timeout", from: user, data: timeoutCallback, message: { chat } },
  };
  await webhook(timeoutInput, [200, 503]);
  state = await inspect();
  assert.equal(actionRow(state, timeoutInput.update_id).status, "uncertain");
  await webhook(timeoutInput, [200, 503]);
  assert.equal(
    publicCalls(await inspect(), "sendMessage").length,
    beforeTimeout + 1,
    "Uncertain delivery cannot automatically resend",
  );
  console.log(
    "Permission loss and network uncertainty are durable; no automatic duplicate channel post is possible.",
  );
  await send(undefined, "ch:title");
  const uncertainSetting = (await send("Uncertain local title update")).reply;
  const uncertainSettingCallback = buttons(uncertainSetting).find((button) =>
    button.callback_data?.startsWith("ch:setting:confirm:"),
  )?.callback_data;
  assert.ok(uncertainSettingCallback);
  const beforeUncertainSetting = publicCalls(await inspect(), "setChatTitle").length;
  await control({ action: "configure", failure: { kind: "timeout", method: "setChatTitle" } });
  const uncertainSettingResult = await send(undefined, uncertainSettingCallback);
  assert.equal(
    actionRow(await inspect(), uncertainSettingResult.input.update_id).status,
    "uncertain",
  );
  const recoveryMenu = (await send("/channel")).reply;
  const resolveSetting = buttons(recoveryMenu).find(
    (button) =>
      button.callback_data === "ch:resolve-settings:" + uncertainSettingResult.input.update_id,
  );
  assert.ok(resolveSetting, "Uncertain metadata changes remain reachable from the channel menu");
  const recovery = (await send(undefined, resolveSetting.callback_data)).reply;
  const notExecuted = buttons(recovery).find((button) =>
    button.callback_data?.startsWith("ch:reconcile:no:"),
  );
  assert.ok(notExecuted);
  const recoveryConfirmation = (await send(undefined, notExecuted.callback_data)).reply;
  const recoveryCommit = buttons(recoveryConfirmation).find((button) =>
    button.callback_data?.startsWith("ch:reconcile:commit:"),
  );
  assert.ok(recoveryCommit);
  await send(undefined, recoveryCommit.callback_data);
  assert.equal(actionRow(await inspect(), uncertainSettingResult.input.update_id).status, "failed");
  assert.equal(
    publicCalls(await inspect(), "setChatTitle").length,
    beforeUncertainSetting + 1,
    "Manual reconciliation records the observed result without repeating the API call",
  );
  await send(undefined, "ch:title");
  const newSetting = (await send("Manually confirmed new title update")).reply;
  const newSettingCallback = buttons(newSetting).find((button) =>
    button.callback_data?.startsWith("ch:setting:confirm:"),
  )?.callback_data;
  assert.ok(newSettingCallback);
  assert.notEqual(newSettingCallback, uncertainSettingCallback);
  await send(undefined, uncertainSettingCallback);
  assert.equal(
    publicCalls(await inspect(), "setChatTitle").length,
    beforeUncertainSetting + 1,
    "A stale setting nonce cannot confirm a newer change",
  );
  await send(undefined, newSettingCallback);
  assert.equal(publicCalls(await inspect(), "setChatTitle").length, beforeUncertainSetting + 2);
  console.log(
    "Uncertain channel settings remain discoverable and require nonce-bound manual recovery before another update.",
  );
  const persistenceId = await draft("Accepted Telegram post with failed result persistence");
  const persistenceCallback = await confirmation(persistenceId, "p");
  const beforePersistence = publicCalls(await inspect(), "sendMessage").length;
  await control({ action: "configure", databaseFailure: "rpc/channel_finish_action" });
  const persistenceInput = {
    update_id: updateId++,
    callback_query: { id: "persistence", from: user, data: persistenceCallback, message: { chat } },
  };
  await webhook(persistenceInput, [503]);
  assert.equal(actionRow(await inspect(), persistenceInput.update_id).status, "sending");
  await webhook(persistenceInput);
  assert.equal(publicCalls(await inspect(), "sendMessage").length, beforePersistence + 1);
  await control({ action: "expireSending", updateId: persistenceInput.update_id });
  await webhook(persistenceInput);
  assert.equal(actionRow(await inspect(), persistenceInput.update_id).status, "uncertain");
  assert.equal(
    publicCalls(await inspect(), "sendMessage").length,
    beforePersistence + 1,
    "Expired result-persistence claim becomes uncertain without resend",
  );
  console.log(
    "Successful Telegram send followed by database failure remains safe across active and expired claim retries.",
  );
  console.log(
    "Channel integration passed using only fake Telegram/Supabase credentials and isolated local PostgreSQL.",
  );
} finally {
  if (server && server.exitCode === null && server.signalCode === null) {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
  }
  if (!skipBuild && (backedUp || !hadBuild)) rmSync(build, { recursive: true, force: true });
  if (backedUp) renameSync(backup, build);
  rmSync(temporary, { recursive: true, force: true });
}
