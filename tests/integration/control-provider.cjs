/* eslint-disable @typescript-eslint/no-require-imports -- Node --require preload intentionally uses CommonJS. */
// Test-process adapter only: loaded with --require. The application never imports this file.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  crypto = require("node:crypto");
const { PGlite } = require("@electric-sql/pglite");
const originalFetch = globalThis.fetch;
const owner = "f81ea9d4-b762-40a9-b627-b2a86b686ac0",
  factorId = "a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1";
const sessions = new Map(),
  files = new Map();
let dbPromise,
  factor = null,
  mode = "owner",
  failDatabase = false;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
async function db() {
  if (!dbPromise)
    dbPromise = (async () => {
      const database = new PGlite();
      await database.exec(
        "create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);",
      );
      const folder = path.join(process.env.CONTROL_VERIFY_ROOT, "supabase/migrations");
      for (const name of fs
        .readdirSync(folder)
        .filter((n) => n.endsWith(".sql"))
        .sort())
        await database.exec(fs.readFileSync(path.join(folder, name), "utf8"));
      await database.exec(
        fs.readFileSync(path.join(process.env.CONTROL_VERIFY_ROOT, "supabase/seed.sql"), "utf8"),
      );
      await database.exec("set role service_role");
      return database;
    })();
  return dbPromise;
}
function user() {
  return {
    id: owner,
    aud: "authenticated",
    email: mode === "foreign" ? "stranger@example.test" : "sardorcodev@gmail.com",
    email_confirmed_at: mode === "unconfirmed" ? null : "2026-10-10T22:27:19Z",
    created_at: "2026-10-10T22:27:19Z",
    is_anonymous: false,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    factors: factor
      ? [{ id: factorId, factor_type: "totp", status: factor, friendly_name: "Control" }]
      : [],
  };
}
function token(aal) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const value =
    encode({ alg: "HS256", typ: "JWT" }) +
    "." +
    encode({
      sub: owner,
      email: user().email,
      aal,
      iat: now,
      exp: now + 3600,
      aud: "authenticated",
      role: "authenticated",
      jti: crypto.randomUUID(),
    }) +
    ".dGVzdHNpZ25hdHVyZQ";
  const refresh = crypto.randomUUID();
  sessions.set(value, { aal, refresh });
  return {
    access_token: value,
    refresh_token: refresh,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    user: user(),
  };
}
const tables = [
  "cms_entries",
  "cms_versions",
  "control_settings",
  "control_settings_versions",
  "control_media",
  "control_requests",
  "control_auth_attempts",
];
if (process.argv.includes("start") && process.env.CONTROL_VERIFY_PORT) {
  http
    .createServer(async (request, response) => {
      const reply = (data, status = 200) => {
        response.writeHead(status, { "Content-Type": "application/json" });
        response.end(JSON.stringify(data));
      };
      if (request.headers["x-verification-secret"] !== process.env.CONTROL_VERIFY_SECRET)
        return reply({}, 401);
      try {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString());
        if (body.action === "upload") {
          files.set(body.path, Buffer.from(body.bytes, "base64"));
          return reply({ ok: true });
        }
        if (body.action === "configure") {
          mode = body.mode || "owner";
          failDatabase = Boolean(body.failDatabase);
          return reply({ ok: true });
        }
        if (body.action === "resetLimit") {
          await (await db()).exec("delete from control_auth_attempts");
          return reply({ ok: true });
        }
        if (body.action === "inspect") {
          const database = await db(),
            result = {};
          for (const table of tables)
            result[table] = (await database.query("select * from " + table)).rows;
          return reply({ rows: result, files: [...files.keys()] });
        }
        reply({}, 400);
      } catch {
        reply({ error: "Fixture control failed" }, 500);
      }
    })
    .listen(Number(process.env.CONTROL_VERIFY_PORT), "127.0.0.1");
}
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url || String(input));
  if (url.hostname !== "psxkpfymzezlcsaasomg.supabase.co") return originalFetch(input, options);
  const method = options.method || "GET",
    headers = new Headers(options.headers),
    access = (headers.get("authorization") || "").replace(/^Bearer /, ""),
    body = typeof options.body === "string" ? JSON.parse(options.body || "{}") : {};
  if (url.pathname.startsWith("/auth/v1/")) {
    const resource = url.pathname.slice(9);
    if (resource === "token" && method === "POST") {
      if (url.searchParams.get("grant_type") === "refresh_token") {
        const session = [...sessions.values()].find((s) => s.refresh === body.refresh_token);
        return session
          ? json(token(session.aal))
          : json({ code: "refresh_token_not_found", msg: "Expired" }, 400);
      }
      return body.password === "test-owner-password-2026"
        ? json(token("aal1"))
        : json({ code: "invalid_credentials", msg: "Invalid credentials" }, 400);
    }
    if (!sessions.has(access)) return json({ code: "bad_jwt", msg: "Invalid JWT" }, 401);
    if (resource === "user") return json(user());
    if (resource === "logout") {
      if (url.searchParams.get("scope") === "global") sessions.clear();
      else sessions.delete(access);
      return new Response(null, { status: 204 });
    }
    if (resource === "factors" && method === "POST") {
      factor = "unverified";
      return json({
        id: factorId,
        type: "totp",
        totp: {
          secret: "JBSWY3DPEHPK3PXP",
          uri: "otpauth://totp/Test",
          qr_code:
            '<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224"><rect width="224" height="224" fill="white"/></svg>',
        },
      });
    }
    if (resource === "factors/" + factorId && method === "DELETE") {
      factor = null;
      return json({ id: factorId });
    }
    if (resource.endsWith("/challenge"))
      return json({ id: crypto.randomUUID(), expires_at: Math.floor(Date.now() / 1000) + 300 });
    if (resource.endsWith("/verify")) {
      if (body.code !== "123456")
        return json({ code: "mfa_verification_failed", msg: "Bad code" }, 422);
      factor = "verified";
      return json(token("aal2"));
    }
    throw new Error("Unexpected fixture auth request: " + resource);
  }
  if (
    headers.get("apikey") !== "sb_secret_local-control-verification" &&
    !url.pathname.startsWith("/storage/v1/")
  )
    throw new Error("Fixture rejected database credential");
  if (url.pathname.startsWith("/storage/v1/")) {
    const prefix = "/storage/v1/object/upload/sign/portfolio-media/";
    if (url.pathname.startsWith(prefix))
      return json({
        url:
          "/object/upload/sign/portfolio-media/" +
          url.pathname.slice(prefix.length) +
          "?token=fixture",
      });
    if (method === "DELETE") {
      for (const item of body.prefixes || []) files.delete(item);
      return json([]);
    }
    const name = url.pathname.replace(
      /^\/storage\/v1\/object\/(authenticated\/)?portfolio-media\//,
      "",
    );
    return files.has(name)
      ? new Response(files.get(name), { headers: { "Content-Type": "image/png" } })
      : json({ error: "not_found" }, 404);
  }
  try {
    const database = await db();
    if (failDatabase) return json({ code: "FIXTURE_FAILURE" }, 503);
    const resource = url.pathname.slice(9);
    if (resource.startsWith("rpc/")) {
      const rpc = {
        control_mutate: [
          "select control_mutate($1,$2,$3::jsonb) as value",
          [body.p_actor, body.p_request_id, JSON.stringify(body.p_payload)],
        ],
        control_rate_limit: ["select control_rate_limit($1) as value", [body.p_key]],
        control_media_begin_delete: ["select control_media_begin_delete($1) as value", [body.p_id]],
      }[resource.slice(4)];
      if (!rpc) throw new Error("Unknown RPC");
      return json((await database.query(...rpc)).rows[0].value);
    }
    if (!tables.includes(resource)) throw new Error("Unknown table");
    const values = [],
      clauses = [];
    const columns = [
      "id",
      "kind",
      "slug",
      "locale",
      "key",
      "entry_id",
      "published",
      "archived_at",
      "status",
    ];
    for (const [field, filter] of url.searchParams) {
      if (!columns.includes(field)) continue;
      if (filter === "not.is.null") clauses.push(field + " is not null");
      else if (filter === "is.null") clauses.push(field + " is null");
      else if (filter.startsWith("eq.")) {
        values.push(filter.slice(3));
        clauses.push(field + "=$" + values.length);
      } else if (filter.startsWith("in.(")) {
        const tokens = filter
          .slice(4, -1)
          .split(",")
          .map((value) => {
            values.push(value);
            return "$" + values.length;
          });
        clauses.push(field + " in (" + tokens.join(",") + ")");
      } else throw new Error("Unknown filter");
    }
    const where = clauses.length ? " where " + clauses.join(" and ") : "";
    if (method === "POST") {
      const keys = Object.keys(body);
      if (!keys.every((k) => ["id", "path", "name", "mime", "size", "created_by"].includes(k)))
        throw new Error("Unsafe fixture insert");
      await database.query(
        "insert into " +
          resource +
          "(" +
          keys.join(",") +
          ") values(" +
          keys.map((_, i) => "$" + (i + 1)).join(",") +
          ")",
        Object.values(body),
      );
      return new Response(null, { status: 204 });
    }
    if (method === "PATCH") {
      if (resource !== "control_media" || Object.keys(body).some((k) => k !== "status"))
        throw new Error("Unsafe fixture patch");
      values.push(body.status);
      const result = await database.query(
        "update control_media set status=$" + values.length + where + " returning *",
        values,
      );
      return headers.get("prefer")?.includes("representation")
        ? json(result.rows)
        : new Response(null, { status: 204 });
    }
    const order = url.searchParams.get("order"),
      select = url.searchParams.get("select"),
      limit = Number(url.searchParams.get("limit") || 500),
      offset = Number(url.searchParams.get("offset") || 0);
    const selectSql = select?.includes("updated_at:published_updated_at")
      ? "id,kind,slug,locale,published,published_at,published_updated_at as updated_at"
      : ["key,published", "key"].includes(select)
        ? select
        : "*";
    if (
      order &&
      ![
        "id.asc",
        "key.asc",
        "updated_at.desc,id.asc",
        "created_at.desc,id.desc",
        "created_at.desc",
      ].includes(order)
    )
      throw new Error("Unsafe order");
    return json(
      (
        await database.query(
          "select " +
            selectSql +
            " from " +
            resource +
            where +
            (order
              ? " order by " +
                order
                  .split(",")
                  .map((part) => part.replace(".", " "))
                  .join(",")
              : "") +
            " limit " +
            limit +
            " offset " +
            offset,
          values,
        )
      ).rows,
    );
  } catch (error) {
    return json(
      { code: error.code || "FIXTURE_ERROR", message: "Local database request failed" },
      error.code === "40001" ? 409 : 400,
    );
  }
};
