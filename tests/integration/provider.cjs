/* This process-only adapter is loaded by verify-flow.mjs, never by the application. */
/* eslint-disable @typescript-eslint/no-require-imports -- The Node --require preload must initialize fetch before Next.js starts. */
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { PGlite } = require(
  path.join(process.env.CMS_VERIFY_ROOT, "node_modules/@electric-sql/pglite"),
);
const nativeFetch = globalThis.fetch;
let instance;
let webhook = "";
const channelId = -1001234567890;
let messageId = 1000;
const telegramCalls = [];
const verification = { botRights: {}, failure: null, databaseFailure: null };
const channelTables = ["channel_config", "channel_posts", "channel_actions"];
async function database() {
  if (!instance)
    instance = (async () => {
      const db = new PGlite();
      await db.exec(
        "create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);",
      );
      const migrations = path.join(process.env.CMS_VERIFY_ROOT, "supabase/migrations");
      for (const filename of fs
        .readdirSync(migrations)
        .filter((f) => f.endsWith(".sql"))
        .sort()) {
        await db.exec(fs.readFileSync(path.join(migrations, filename), "utf8"));
      }
      await db.exec(
        fs.readFileSync(path.join(process.env.CMS_VERIFY_ROOT, "supabase/seed.sql"), "utf8"),
      );
      await db.exec("set role service_role");
      return db;
    })();
  return instance;
}
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
function telegramBody(options) {
  return JSON.parse(options.body || "{}");
}
function channelDestination(body) {
  return [String(channelId), "@sardorcodev"].includes(String(body.chat_id));
}
// This control listener exists only in the --require test process. The production
// application has no route, environment variable, or import for this adapter.
if (process.argv.includes("start") && process.env.CMS_VERIFY_CONTROL_PORT) {
  const control = http.createServer(async (request, response) => {
    const reply = (data, status = 200) => {
      response.writeHead(status, { "Content-Type": "application/json" });
      response.end(JSON.stringify(data));
    };
    if (
      request.url !== "/__verification" ||
      request.method !== "POST" ||
      request.headers["x-verification-secret"] !== process.env.CMS_VERIFY_CONTROL_SECRET
    ) {
      reply({ error: "Unauthorized" }, 401);
      return;
    }
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (body.action === "configure") {
        if (body.botRights) verification.botRights = body.botRights;
        if (Object.hasOwn(body, "failure")) verification.failure = body.failure;
        if (Object.hasOwn(body, "databaseFailure"))
          verification.databaseFailure = body.databaseFailure;
        reply({ ok: true });
      } else if (body.action === "inspect") {
        const db = await database();
        const rows = {};
        for (const table of ["cms_sessions", "cms_updates", ...channelTables]) {
          if ((await db.query("select to_regclass($1) as name", [table])).rows[0].name)
            rows[table] = (await db.query("select * from " + table)).rows;
        }
        reply({ calls: telegramCalls, rows });
      } else if (body.action === "expireSending") {
        const db = await database();
        await db.query(
          "update channel_actions set started_at = clock_timestamp() - interval '2 minutes' where update_id = $1 and status = 'sending'",
          [body.updateId],
        );
        reply({ ok: true });
      } else reply({ error: "Unknown control" }, 400);
    } catch {
      reply({ error: "Verification control failed" }, 500);
    }
  });
  control.listen(Number(process.env.CMS_VERIFY_CONTROL_PORT), "127.0.0.1");
}
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url || String(input));
  if (url.hostname === "api.telegram.org") {
    const method = url.pathname.split("/").at(-1);
    const body = telegramBody(options);
    if (url.pathname.endsWith("/getMe"))
      return json({ ok: true, result: { id: 777, is_bot: true, username: "sardorcodevbot" } });
    if (method === "getChat")
      if (!channelDestination(body)) throw new Error("Unexpected verification channel target");
      else
        return json({
          ok: true,
          result: {
            id: channelId,
            type: "channel",
            username: "sardorcodev",
            title: "Sardor's workshop",
            description: "Local integration channel",
          },
        });
    if (method === "getChatMember") {
      if (
        !channelDestination(body) ||
        !["777", process.env.TELEGRAM_ADMIN_USER_ID].includes(String(body.user_id))
      )
        throw new Error("Unexpected verification channel member");
      return json({
        ok: true,
        result:
          String(body.user_id) === "777"
            ? {
                status: "administrator",
                user: { id: 777, is_bot: true },
                can_post_messages: true,
                can_edit_messages: true,
                can_delete_messages: true,
                can_change_info: true,
                can_pin_messages: true,
                ...verification.botRights,
              }
            : { status: "creator", user: { id: Number(body.user_id), is_bot: false } },
      });
    }
    if (method === "getChatMemberCount") {
      if (!channelDestination(body)) throw new Error("Unexpected verification channel target");
      return json({ ok: true, result: 123 });
    }
    if (url.pathname.endsWith("/getWebhookInfo"))
      return json({ ok: true, result: { url: webhook, pending_update_count: 0 } });
    if (url.pathname.endsWith("/setWebhook")) {
      if (
        body.url !== "https://sardorcodev.uz/api/telegram" ||
        body.drop_pending_updates !== false ||
        body.max_connections !== 1
      )
        throw new Error("Unsafe verification webhook registration");
      webhook = body.url;
      return json({ ok: true, result: true });
    }
    const messageMethods = ["sendMessage", "sendPhoto", "sendVideo", "sendDocument"];
    const editMethods = [
      "editMessageText",
      "editMessageCaption",
      "editMessageMedia",
      "editMessageReplyMarkup",
    ];
    const booleanMethods = [
      "pinChatMessage",
      "unpinChatMessage",
      "deleteMessage",
      "setChatTitle",
      "setChatDescription",
    ];
    if (
      ![...messageMethods, ...editMethods, ...booleanMethods, "answerCallbackQuery"].includes(
        method,
      )
    )
      throw new Error("Unexpected verification Telegram method");
    const publicCall = channelDestination(body);
    if (
      method !== "answerCallbackQuery" &&
      !publicCall &&
      String(body.chat_id) !== process.env.TELEGRAM_ADMIN_USER_ID
    )
      throw new Error("Unexpected verification message target");
    const event = { method, body, public: publicCall, outcome: "success" };
    telegramCalls.push(event);
    if (publicCall && verification.failure?.method === method) {
      const failure = verification.failure;
      verification.failure = null;
      if (failure.kind === "timeout") {
        event.outcome = "uncertain";
        throw new Error("Local simulated connection timeout");
      }
      event.outcome = "rejected";
      return json(
        { ok: false, error_code: 403, description: "Local simulated permission loss" },
        403,
      );
    }
    if (messageMethods.includes(method) && !publicCall) {
      fs.writeFileSync(process.env.CMS_VERIFY_REPLY, options.body);
    }
    if (booleanMethods.includes(method) || method === "answerCallbackQuery")
      return json({ ok: true, result: true });
    const result = {
      message_id: body.message_id || messageId++,
      date: Math.floor(Date.now() / 1000),
      chat: {
        id: publicCall ? channelId : Number(body.chat_id),
        type: publicCall ? "channel" : "private",
      },
      ...(body.text ? { text: body.text, entities: body.entities } : {}),
      ...(body.caption ? { caption: body.caption, caption_entities: body.caption_entities } : {}),
    };
    event.message_id = result.message_id;
    return json({ ok: true, result });
  }
  if (url.hostname !== "psxkpfymzezlcsaasomg.supabase.co") return nativeFetch(input, options);
  if (!url.pathname.startsWith("/rest/v1/"))
    throw new Error("Unexpected verification Supabase path");
  const db = await database();
  const resource = url.pathname.slice("/rest/v1/".length);
  try {
    if (resource.startsWith("rpc/")) {
      const body = JSON.parse(options.body);
      const channelRpc = {
        "rpc/channel_bind": { sql: "select channel_bind($1) as value", args: ["p_chat_id"] },
        "rpc/channel_commit_update": {
          sql: "select channel_commit_update($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb) as value",
          args: [
            "p_update_id",
            "p_user_id",
            "p_session_revision",
            "p_session",
            "p_mutation",
            "p_reply",
          ],
          json: ["p_session", "p_mutation", "p_reply"],
        },
        "rpc/channel_claim_action": {
          sql: "select channel_claim_action($1,$2::uuid) as value",
          args: ["p_update_id", "p_claim_token"],
        },
        "rpc/channel_finish_action": {
          sql: "select channel_finish_action($1,$2::uuid,$3,$4::jsonb,$5) as value",
          args: ["p_update_id", "p_claim_token", "p_status", "p_result", "p_error"],
          json: ["p_result"],
        },
      }[resource];
      if (channelRpc) {
        if (verification.databaseFailure === resource) {
          verification.databaseFailure = null;
          return json({ code: "VERIFY_DB_FAILURE", message: "Local persistence failure" }, 503);
        }
        const values = channelRpc.args.map((key) =>
          channelRpc.json?.includes(key) ? JSON.stringify(body[key]) : body[key],
        );
        return json((await db.query(channelRpc.sql, values)).rows[0].value);
      }
      if (resource === "rpc/cms_previous_draft")
        return json(
          (await db.query("select cms_previous_draft($1) as value", [body.p_entry_id])).rows[0]
            .value,
        );
      if (resource !== "rpc/cms_commit_update") throw new Error("Unexpected verification RPC");
      const result = await db.query(
        "select cms_commit_update($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb) as value",
        [
          body.p_update_id,
          body.p_user_id,
          body.p_session_revision,
          JSON.stringify(body.p_session),
          JSON.stringify(body.p_mutation),
          JSON.stringify(body.p_reply),
        ],
      );
      return json(result.rows[0].value);
    }
    if (!["cms_entries", "cms_sessions", "cms_updates", ...channelTables].includes(resource))
      throw new Error("Unexpected verification table");
    const values = [],
      clauses = [];
    for (const [field, filter] of url.searchParams) {
      if (field === "published" && filter === "not.is.null") clauses.push("published is not null");
      else if (
        [
          "id",
          "kind",
          "slug",
          "locale",
          "user_id",
          "update_id",
          "username",
          "post_id",
          "chat_id",
          "message_id",
          "status",
        ].includes(field)
      ) {
        if (filter === "is.null") {
          clauses.push(field + " is null");
        } else if (filter.startsWith("eq.")) {
          values.push(filter.slice(3));
          clauses.push(field + "=$" + values.length);
        } else if (filter.startsWith("neq.")) {
          values.push(filter.slice(4));
          clauses.push(field + "<>$" + values.length);
        } else if (filter.startsWith("in.(") && filter.endsWith(")")) {
          const terms = filter.slice(4, -1).split(",");
          const placeholders = terms.map((term) => {
            values.push(term);
            return "$" + values.length;
          });
          clauses.push(field + " in (" + placeholders.join(",") + ")");
        } else throw new Error("Unexpected verification filter");
      }
    }
    const where = clauses.length ? " where " + clauses.join(" and ") : "";
    if (options.method === "PATCH") {
      if (resource !== "cms_updates") throw new Error("Unexpected verification mutation");
      const body = JSON.parse(options.body);
      if (body.reply) {
        values.push(JSON.stringify(body.reply));
        await db.query(
          "update cms_updates set delivered=true, reply=$" + values.length + "::jsonb" + where,
          values,
        );
      } else await db.query("update cms_updates set delivered=true" + where, values);
      return new Response(null, { status: 204 });
    }
    const order = url.searchParams.get("order");
    if (order && !["id.asc", "updated_at.desc", "created_at.desc", "update_id.asc"].includes(order))
      throw new Error("Unexpected verification order");
    const limit = Number(url.searchParams.get("limit") || 500);
    const offset = Number(url.searchParams.get("offset") || 0);
    if (!Number.isInteger(limit) || !Number.isInteger(offset))
      throw new Error("Unexpected verification pagination");
    const select = url.searchParams.get("select")?.includes("updated_at:published_updated_at")
      ? "id,kind,slug,locale,published,published_at,published_updated_at as updated_at"
      : "*";
    const rows = await db.query(
      "select " +
        select +
        " from " +
        resource +
        where +
        (order ? " order by " + order.replace(".", " ") : "") +
        " limit " +
        limit +
        " offset " +
        offset,
      values,
    );
    return json(rows.rows);
  } catch (error) {
    return json(
      { code: error.code || "VERIFY_ERROR", message: "Verification database request failed" },
      error.code === "40001" ? 409 : 400,
    );
  }
};
