"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fields, contentPath, type ContentKind } from "@/lib/cms/model";
import { type ControlEntry, type Version, entryStatus, newDraft } from "@/lib/control/model";
import { locales, type Locale } from "@/lib/locales";
import { api, dateLabel } from "./api";
import { useDraft } from "./use-draft";
import { MediaLibrary } from "./media";

export const kindLabels: Record<ContentKind, string> = {
  post: "Blog",
  project: "Loyihalar",
  profile: "Profillar",
};
export const languageLabels: Record<Locale, string> = {
  uz: "O‘zbekcha",
  en: "English",
  ru: "Русский",
};

export function CreateEntry({
  kind,
  locale = "uz",
  slug = "",
  draft,
  onCreated,
  onCancel,
}: {
  kind: ContentKind;
  locale?: Locale;
  slug?: string;
  draft?: Record<string, unknown>;
  onCreated: (entry: ControlEntry) => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ entry: ControlEntry }>("mutate", {
        requestId: crypto.randomUUID(),
        target: "entry",
        op: "create",
        id: crypto.randomUUID(),
        kind,
        slug: form.get("slug"),
        locale: form.get("locale"),
        draft: { ...(draft || newDraft(kind)), title: form.get("title") },
      });
      onCreated(result.entry);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Yangi {kind === "post" ? "maqola" : kind === "project" ? "loyiha" : "profil"}</h2>
      <p>Avval qoralama yaratiladi. Har bir tarjima alohida tekshiriladi va nashr qilinadi.</p>
      <form onSubmit={submit} className="form-grid">
        <label>
          Sarlavha
          <input name="title" required maxLength={120} defaultValue={String(draft?.title || "")} />
        </label>
        <label>
          Manzil (slug)
          <input
            name="slug"
            required
            maxLength={60}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={slug}
            readOnly={Boolean(slug)}
            placeholder="mening-yangi-loyiham"
          />
          <small>Lotin harflari, raqam va tire. Saqlangach manzil o‘zgarmaydi.</small>
        </label>
        <label>
          Til
          <select name="locale" defaultValue={locale}>
            {locales.map((l) => (
              <option key={l} value={l}>
                {languageLabels[l]}
              </option>
            ))}
          </select>
        </label>
        <div className="actions full">
          <button disabled={busy}>Qoralama yaratish</button>
          <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
            Bekor qilish
          </button>
        </div>
        {error && (
          <p role="alert" className="notice error full">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

export function History({
  target,
  id,
  onRestore,
  disabled,
}: {
  target: "entry" | "settings";
  id: string;
  onRestore: (id: string) => void;
  disabled: boolean;
}) {
  const [versions, setVersions] = useState<Version[] | null>(null),
    [error, setError] = useState("");
  async function load() {
    try {
      setVersions(await api("history?target=" + target + "&id=" + id));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <details
      className="history"
      onToggle={(event) => {
        if (event.currentTarget.open) void load();
      }}
    >
      <summary>Tahrir tarixi va tiklash</summary>
      <p>Oldingi nusxa qoralamaga tiklanadi. Jonli versiya nashr qilmaguningizcha o‘zgarmaydi.</p>
      {error && <p role="alert">{error}</p>}
      {versions?.length === 0 && <p>Hozircha oldingi nusxalar yo‘q.</p>}
      <ul>
        {versions?.map((version) => (
          <li key={version.id}>
            <span>
              {dateLabel(version.created_at)} <small>· {version.action}</small>
            </span>
            <button
              className="secondary compact"
              disabled={disabled}
              onClick={() => {
                if (window.confirm("Saqlanmagan tahrir o‘rniga bu nusxani qoralamaga tiklaysizmi?"))
                  onRestore(version.id);
              }}
            >
              Tiklash
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function EntryEditor({
  initial,
  entries,
  onUpdate,
  onSelect,
  onCreateTranslation,
  onBack,
}: {
  initial: ControlEntry;
  entries: ControlEntry[];
  onUpdate: (entry: ControlEntry) => void;
  onSelect: (entry: ControlEntry) => void;
  onCreateTranslation: (locale: Locale, draft: Record<string, unknown>) => void;
  onBack: () => void;
}) {
  const editor = useDraft(
    initial,
    { target: "entry", id: initial.id },
    (result) => result.entry,
    onUpdate,
  );
  const { row, draft, setDraft, busy, dirty, error, conflict, mutate } = editor;
  const [preview, setPreview] = useState(false),
    [media, setMedia] = useState(false),
    [previewError, setPreviewError] = useState("");
  const leave = (action: () => void) => {
    if (!dirty || window.confirm("Saqlanmagan tahrir bor. Bu oynadan chiqasizmi?")) action();
  };
  async function actualPreview() {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    setPreviewError("");
    if (dirty && !(await mutate("save"))) {
      tab?.close();
      return;
    }
    try {
      const result = await api<{ url: string }>("preview?id=" + row.id);
      if (tab) tab.location.href = result.url;
      else setPreviewError("Brauzer yangi oynani to‘sdi. Ruxsat berib qayta urinib ko‘ring.");
    } catch (e) {
      tab?.close();
      setPreviewError((e as Error).message);
    }
  }
  return (
    <section className="editor">
      <div className="section-heading">
        <div>
          <button className="text-button" disabled={busy} onClick={() => leave(onBack)}>
            ← {kindLabels[row.kind]}
          </button>
          <h1>{String(draft.title || "Nomsiz qoralama")}</h1>
          <p>
            <code>{"/" + row.locale + contentPath(row.kind, row.slug)}</code>{" "}
            <span className="badge">{entryStatus(row)}</span>
          </p>
        </div>
        <span className="save-status" role="status">
          {busy ? "Saqlanmoqda…" : dirty ? "Saqlanmagan tahrir" : "Qoralama saqlangan"}
        </span>
      </div>
      <div className="locale-tabs" aria-label="Tarjimalar">
        {locales.map((locale) => {
          const match = entries.find(
            (e) => e.kind === row.kind && e.slug === row.slug && e.locale === locale,
          );
          return (
            <button
              key={locale}
              disabled={busy}
              className={locale === row.locale ? "active" : "secondary"}
              onClick={() =>
                leave(() => (match ? onSelect(match) : onCreateTranslation(locale, draft)))
              }
            >
              {languageLabels[locale]}
              {match ? "" : " +"}
            </button>
          );
        })}
      </div>
      {(error || previewError) && (
        <p className="notice error" role="alert">
          {error || previewError}
        </p>
      )}
      {conflict && (
        <div className="notice">
          <p>Tahriringizni yuklab oling, keyin bazadagi yangi nusxani oching.</p>
          <div className="actions">
            <button className="secondary" onClick={editor.backup}>
              Tahrirni yuklab olish
            </button>
            <button
              onClick={async () => {
                if (
                  !window.confirm(
                    "Mahalliy tahrir o‘rniga bazadagi nusxani ochasizmi? Avval yuklab olganingizni tekshiring.",
                  )
                )
                  return;
                try {
                  const latest = (await api<ControlEntry[]>("entries")).find(
                    (e) => e.id === row.id,
                  );
                  if (latest) editor.reload(latest);
                } catch (e) {
                  setPreviewError((e as Error).message);
                }
              }}
            >
              Yangi nusxani ochish
            </button>
          </div>
        </div>
      )}
      <div className="editor-toolbar">
        <button
          className="secondary"
          disabled={busy || conflict || Boolean(row.archived_at)}
          onClick={() => void mutate("save")}
        >
          Saqlash · Ctrl S
        </button>
        {row.kind !== "profile" && (
          <button
            className="secondary"
            disabled={busy || conflict || Boolean(row.archived_at)}
            onClick={actualPreview}
          >
            Saytdagi ko‘rinish ↗
          </button>
        )}
        <button
          disabled={busy || conflict || Boolean(row.archived_at)}
          onClick={() => {
            if (window.confirm("Bu tildagi yozuvni ommaviy saytga nashr qilasizmi?"))
              void mutate("publish");
          }}
        >
          Nashr qilish
        </button>
      </div>
      <fieldset disabled={(busy && !dirty) || Boolean(row.archived_at)} className="form-grid panel">
        <legend className="sr-only">Kontent maydonlari</legend>
        {Object.entries(fields[row.kind]).map(([key, label]) => (
          <label
            key={key}
            htmlFor={"entry-" + key}
            className={key === "body" || key === "summary" ? "full" : undefined}
          >
            {label}
            {key === "body" ? (
              <>
                <div className="actions compact-actions">
                  <button
                    type="button"
                    className="secondary compact"
                    onClick={() => setPreview(!preview)}
                  >
                    {preview ? "Matn tahriri" : "Markdown ko‘rinishi"}
                  </button>
                  <small>Markdown: # sarlavha · **qalin** · [matn](https://…)</small>
                </div>
                {preview ? (
                  <div className="markdown-preview">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {String(draft[key] || "")}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    id={"entry-" + key}
                    name={key}
                    rows={18}
                    maxLength={60000}
                    value={String(draft[key] || "")}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    className="code-input"
                  />
                )}
              </>
            ) : key === "summary" ? (
              <textarea
                id={"entry-" + key}
                name={key}
                rows={3}
                maxLength={400}
                value={String(draft[key] || "")}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            ) : key === "category" && row.kind !== "project" ? (
              <select
                id={"entry-" + key}
                name={key}
                value={String(draft[key] || "")}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              >
                {(row.kind === "post"
                  ? ["work", "milestone", "thoughts", "learning"]
                  : ["code", "social", "video", "contact"]
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  id={"entry-" + key}
                  name={key}
                  type={key === "order" ? "number" : "text"}
                  min={key === "order" ? 0 : undefined}
                  max={key === "order" ? 999 : undefined}
                  maxLength={key === "title" ? 120 : key === "imageAlt" ? 240 : 1000}
                  value={
                    key === "stack"
                      ? ((draft[key] as string[]) || []).join(", ")
                      : String(draft[key] ?? "")
                  }
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [key]:
                        key === "order"
                          ? Number(e.target.value)
                          : key === "stack"
                            ? e.target.value.split(",").map((x) => x.trim())
                            : e.target.value,
                    })
                  }
                />
                {key === "image" && (
                  <button type="button" className="text-button" onClick={() => setMedia(!media)}>
                    Rasmlar kutubxonasidan tanlash
                  </button>
                )}
              </>
            )}
          </label>
        ))}
      </fieldset>
      {media && (
        <MediaLibrary
          onChoose={(url) => {
            setDraft({ ...draft, image: url });
            setMedia(false);
          }}
        />
      )}
      <History
        key={row.revision}
        target="entry"
        id={row.id}
        disabled={busy || conflict}
        onRestore={(id) => void mutate("restore", { versionId: id })}
      />
      <div className="panel danger-zone">
        <h2>Nashr va arxiv</h2>
        <p>Arxiv yozuvni saqlaydi va ommaviy saytdan olib tashlaydi.</p>
        <div className="actions">
          {row.published && (
            <button
              className="secondary"
              disabled={busy || conflict}
              onClick={() => {
                if (window.confirm("Yozuvni ommaviy saytdan olib, qoralama sifatida saqlaysizmi?"))
                  void mutate("unpublish");
              }}
            >
              Nashrdan olish
            </button>
          )}
          <button
            className="secondary"
            disabled={busy || conflict}
            onClick={async () => {
              if (
                window.confirm(
                  row.archived_at
                    ? "Yozuvni arxivdan qoralamaga qaytarasizmi?"
                    : "Yozuvni arxivga o‘tkazasizmi?",
                )
              ) {
                if (!row.archived_at && dirty && !(await mutate("save"))) return;
                await mutate(row.archived_at ? "unarchive" : "archive");
              }
            }}
          >
            {row.archived_at ? "Arxivdan qaytarish" : "Arxivga olish"}
          </button>
        </div>
      </div>
    </section>
  );
}
