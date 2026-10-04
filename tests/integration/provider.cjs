/* This process-only adapter is loaded by verify-flow.mjs, never by the application. */
/* eslint-disable @typescript-eslint/no-require-imports -- The Node --require preload must initialize fetch before Next.js starts. */
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require(
  path.join(process.env.CMS_VERIFY_ROOT, "node_modules/@electric-sql/pglite"),
);
const nativeFetch = globalThis.fetch;
let instance;
let webhook = "";
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
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url || String(input));
  if (url.hostname === "api.telegram.org") {
    if (url.pathname.endsWith("/getMe"))
      return json({ ok: true, result: { username: "sardorcodevbot" } });
    if (url.pathname.endsWith("/getWebhookInfo"))
      return json({ ok: true, result: { url: webhook, pending_update_count: 0 } });
    if (url.pathname.endsWith("/setWebhook")) {
      const body = JSON.parse(options.body);
      if (
        body.url !== "https://sardorcodev.uz/api/telegram" ||
        body.drop_pending_updates !== false ||
        body.max_connections !== 1
      )
        throw new Error("Unsafe verification webhook registration");
      webhook = body.url;
      return json({ ok: true, result: true });
    }
    if (!url.pathname.endsWith("/sendMessage") && !url.pathname.endsWith("/answerCallbackQuery"))
      throw new Error("Unexpected verification Telegram method");
    if (url.pathname.endsWith("/sendMessage")) {
      fs.writeFileSync(process.env.CMS_VERIFY_REPLY, options.body);
    }
    return json({ ok: true, result: { message_id: 1 } });
  }
  if (url.hostname !== "psxkpfymzezlcsaasomg.supabase.co") return nativeFetch(input, options);
  if (!url.pathname.startsWith("/rest/v1/"))
    throw new Error("Unexpected verification Supabase path");
  const db = await database();
  const resource = url.pathname.slice("/rest/v1/".length);
  try {
    if (resource.startsWith("rpc/")) {
      const body = JSON.parse(options.body);
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
    if (!["cms_entries", "cms_sessions", "cms_updates"].includes(resource))
      throw new Error("Unexpected verification table");
    const values = [],
      clauses = [];
    for (const [field, filter] of url.searchParams) {
      if (field === "published" && filter === "not.is.null") clauses.push("published is not null");
      else if (["id", "kind", "slug", "locale", "user_id", "update_id"].includes(field)) {
        if (!filter.startsWith("eq.")) throw new Error("Unexpected verification filter");
        values.push(filter.slice(3));
        clauses.push(field + "=$" + values.length);
      }
    }
    const where = clauses.length ? " where " + clauses.join(" and ") : "";
    if (options.method === "PATCH") {
      if (resource !== "cms_updates") throw new Error("Unexpected verification mutation");
      await db.query("update cms_updates set delivered=true" + where, values);
      return new Response(null, { status: 204 });
    }
    const order = url.searchParams.get("order");
    if (order && !["id.asc", "updated_at.desc"].includes(order))
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
