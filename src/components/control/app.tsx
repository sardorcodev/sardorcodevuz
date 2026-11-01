"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AuthState,
  type ControlEntry,
  type SettingsRow,
  entryStatus,
} from "@/lib/control/model";
import type { ContentKind } from "@/lib/cms/model";
import { locales, type Locale } from "@/lib/locales";
import { api, dateLabel } from "./api";
import { AuthGate } from "./auth";
import { CreateEntry, EntryEditor, kindLabels, languageLabels } from "./editor";
import { MediaLibrary } from "./media";
import { SecuritySettings, SettingsEditor } from "./settings";

type Section = "overview" | ContentKind | "copy" | "media" | "settings";
type Status = {
  database: string;
  deployment: string;
  commit: string | null;
  branch: string | null;
};
const sections: [Section, string, string][] = [
  ["overview", "Umumiy ko‘rinish", "◈"],
  ["post", "Blog", "✎"],
  ["project", "Loyihalar", "▦"],
  ["profile", "Profillar", "↗"],
  ["copy", "Sahifa matnlari", "Aa"],
  ["media", "Rasmlar", "▧"],
  ["settings", "Sozlamalar", "⚙"],
];

export function ControlApp({ initialAuth }: { initialAuth: AuthState }) {
  const [auth, setAuth] = useState(initialAuth);
  return auth.step === "ready" ? (
    <ControlWorkspace onState={setAuth} email={auth.email || ""} />
  ) : (
    <AuthGate key={auth.step} state={auth} onState={setAuth} />
  );
}
function ControlWorkspace({
  onState,
  email,
}: {
  onState: (state: AuthState) => void;
  email: string;
}) {
  const [section, setSection] = useState<Section>("overview"),
    [entries, setEntries] = useState<ControlEntry[]>([]),
    [settings, setSettings] = useState<SettingsRow[]>([]),
    [status, setStatus] = useState<Status | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null),
    [creation, setCreation] = useState<{
      kind: ContentKind;
      locale?: Locale;
      slug?: string;
      draft?: Record<string, unknown>;
    } | null>(null),
    [copyLocale, setCopyLocale] = useState<Locale>("uz"),
    [search, setSearch] = useState(""),
    [filterLocale, setFilterLocale] = useState("all"),
    [filterStatus, setFilterStatus] = useState("active");
  const navigation = useRef<HTMLHeadingElement>(null);
  const load = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([
        api<ControlEntry[]>("entries"),
        api<SettingsRow[]>("settings"),
        api<Status>("status"),
      ]);
      setError("");
      setEntries(a);
      setSettings(b);
      setStatus(c);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let disposed = false;
    Promise.all([
      api<ControlEntry[]>("entries"),
      api<SettingsRow[]>("settings"),
      api<Status>("status"),
    ])
      .then(([a, b, c]) => {
        if (!disposed) {
          setEntries(a);
          setSettings(b);
          setStatus(c);
        }
      })
      .catch((e) => {
        if (!disposed) setError((e as Error).message);
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, []);
  function update(entry: ControlEntry) {
    setEntries((current) => [entry, ...current.filter((e) => e.id !== entry.id)]);
  }
  function updateSettings(row: SettingsRow) {
    setSettings((current) => current.map((item) => (item.key === row.key ? row : item)));
  }
  function navigate(next: Section) {
    if (
      document.querySelector(".save-status")?.textContent?.includes("Saqlanmagan") &&
      !window.confirm("Saqlanmagan tahrir bor. Boshqa bo‘limga o‘tasizmi?")
    )
      return;
    setSection(next);
    setSelected(null);
    setCreation(null);
    setSearch("");
    setTimeout(() => navigation.current?.focus(), 0);
  }
  const current = entries.find((e) => e.id === selected);
  const title = sections.find(([key]) => key === section)![1];
  const active = entries.filter((e) => !e.archived_at);
  const published = active.filter((e) => e.published);
  const filtered = entries.filter(
    (e) =>
      e.kind === section &&
      (filterLocale === "all" || e.locale === filterLocale) &&
      (filterStatus === "all" || filterStatus === "archive"
        ? filterStatus === "all" || Boolean(e.archived_at)
        : !e.archived_at &&
          (filterStatus === "active" ||
            (filterStatus === "published" && Boolean(e.published)) ||
            (filterStatus === "draft" && !e.published))) &&
      (e.slug + " " + String(e.draft.title || "")).toLowerCase().includes(search.toLowerCase()),
  );
  async function logout() {
    if (
      document.querySelector(".save-status")?.textContent?.includes("Saqlanmagan") &&
      !window.confirm("Saqlanmagan tahrir bor. Paneldan chiqasizmi?")
    )
      return;
    try {
      onState(await api("auth/logout", {}));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="control-shell">
      <aside className="sidebar">
        <Link href="/uz" className="control-wordmark">
          sardorcodev<span> / control</span>
        </Link>
        <div className="eyebrow">SHAXSIY USTAXONA</div>
        <nav aria-label="Boshqaruv bo‘limlari">
          {sections.map(([key, label, icon]) => (
            <button
              key={key}
              aria-current={section === key ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <small>{email}</small>
          <button className="secondary" onClick={logout}>
            Chiqish
          </button>
        </div>
      </aside>
      <div className="control-content">
        <header className="control-topbar">
          <span>Qoralama → tekshirish → nashr</span>
          <a href="/uz" target="_blank" rel="noopener noreferrer">
            Saytni ochish ↗
          </a>
        </header>
        <main id="control-main">
          <div className="section-heading">
            <div>
              <div className="eyebrow">CONTROL PANEL</div>
              <h1 ref={navigation} tabIndex={-1}>
                {title}
              </h1>
            </div>
            {(section === "post" || section === "project" || section === "profile") &&
              !selected &&
              !creation && (
                <button onClick={() => setCreation({ kind: section })}>+ Yangi yozuv</button>
              )}
          </div>
          {error && (
            <div className="notice error" role="alert">
              <p>{error}</p>
              <button className="secondary" onClick={() => void load()}>
                Qayta yuklash
              </button>
              <button className="text-button" onClick={() => void logout()}>
                Qayta kirish
              </button>
            </div>
          )}
          {loading ? (
            <div className="panel" role="status">
              Kontent yuklanmoqda…
            </div>
          ) : (
            !error && (
              <>
                {section === "overview" && (
                  <>
                    <div className="stat-grid">
                      {(["post", "project", "profile"] as ContentKind[]).map((kind) => (
                        <button key={kind} className="stat-card" onClick={() => navigate(kind)}>
                          <span>{kindLabels[kind]}</span>
                          <strong>{active.filter((e) => e.kind === kind).length}</strong>
                          <small>
                            {published.filter((e) => e.kind === kind).length} nashr qilingan ·
                            barcha tillar
                          </small>
                        </button>
                      ))}
                    </div>
                    <section className="panel">
                      <h2>Oxirgi tahrirlar</h2>
                      <EntryTable
                        entries={[...active]
                          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
                          .slice(0, 6)}
                        onSelect={(entry) => {
                          setSection(entry.kind);
                          setSelected(entry.id);
                        }}
                      />
                    </section>
                    <section className="panel">
                      <h2>Tarjimalar holati</h2>
                      <p>
                        Har bir tildagi kontent alohida nashr qilinadi. Inglizcha yoki ruscha
                        tarjimasi yo‘q yozuvlarga paneldan yangi tarjima qo‘shing.
                      </p>
                      <div className="locale-summary">
                        {locales.map((locale) => (
                          <div key={locale}>
                            <strong>{languageLabels[locale]}</strong>
                            <span>
                              {published.filter((e) => e.locale === locale).length} nashr ·{" "}
                              {active.filter((e) => e.locale === locale && !e.published).length}{" "}
                              qoralama
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                    <Pipeline status={status} />
                  </>
                )}
                {(section === "post" || section === "project" || section === "profile") &&
                  (creation ? (
                    <CreateEntry
                      key={creation.kind + creation.locale}
                      {...creation}
                      onCancel={() => setCreation(null)}
                      onCreated={(entry) => {
                        update(entry);
                        setCreation(null);
                        setSelected(entry.id);
                      }}
                    />
                  ) : current ? (
                    <EntryEditor
                      key={current.id}
                      initial={current}
                      entries={entries}
                      onUpdate={update}
                      onSelect={(entry) => setSelected(entry.id)}
                      onBack={() => setSelected(null)}
                      onCreateTranslation={(locale, draft) => {
                        setCreation({ kind: current.kind, locale, slug: current.slug, draft });
                        setSelected(null);
                      }}
                    />
                  ) : (
                    <>
                      <div className="filters">
                        <label>
                          Qidirish
                          <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Sarlavha yoki manzil…"
                          />
                        </label>
                        <label>
                          Til
                          <select
                            value={filterLocale}
                            onChange={(e) => setFilterLocale(e.target.value)}
                          >
                            <option value="all">Barcha tillar</option>
                            {locales.map((l) => (
                              <option key={l} value={l}>
                                {languageLabels[l]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Holat
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                          >
                            <option value="active">Faol yozuvlar</option>
                            <option value="published">Nashr qilingan</option>
                            <option value="draft">Qoralamalar</option>
                            <option value="archive">Arxiv</option>
                            <option value="all">Barchasi</option>
                          </select>
                        </label>
                      </div>
                      <section className="panel">
                        <EntryTable
                          entries={filtered}
                          onSelect={(entry) => setSelected(entry.id)}
                        />
                      </section>
                    </>
                  ))}
                {section === "copy" && (
                  <>
                    <div className="locale-tabs">
                      {locales.map((l) => (
                        <button
                          key={l}
                          className={l === copyLocale ? "active" : "secondary"}
                          onClick={() => {
                            if (
                              !document
                                .querySelector(".save-status")
                                ?.textContent?.includes("Saqlanmagan") ||
                              window.confirm("Saqlanmagan tahrir bor. Tilni almashtirasizmi?")
                            )
                              setCopyLocale(l);
                          }}
                        >
                          {languageLabels[l]}
                        </button>
                      ))}
                    </div>
                    {settings.find((s) => s.key === copyLocale) && (
                      <SettingsEditor
                        key={copyLocale}
                        initial={settings.find((s) => s.key === copyLocale)!}
                        onUpdate={updateSettings}
                      />
                    )}
                  </>
                )}
                {section === "media" && <MediaLibrary />}
                {section === "settings" && (
                  <>
                    {settings.find((s) => s.key === "global") && (
                      <SettingsEditor
                        initial={settings.find((s) => s.key === "global")!}
                        onUpdate={updateSettings}
                      />
                    )}
                    <SecuritySettings onState={onState} />
                    <Pipeline status={status} />
                  </>
                )}
              </>
            )
          )}
        </main>
        <footer className="control-footer">
          sardorcodev · shaxsiy boshqaruv · faqat siz uchun
        </footer>
      </div>
    </div>
  );
}

function EntryTable({
  entries,
  onSelect,
}: {
  entries: ControlEntry[];
  onSelect: (entry: ControlEntry) => void;
}) {
  return entries.length === 0 ? (
    <p className="empty-state">
      Yozuv topilmadi. Yangi qoralama yarating yoki filtrni almashtiring.
    </p>
  ) : (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Yozuv</th>
            <th scope="col">Til</th>
            <th scope="col">Holat</th>
            <th scope="col">Oxirgi tahrir</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>
                <button className="entry-link" onClick={() => onSelect(entry)}>
                  {String(entry.draft.title || "Nomsiz qoralama")}
                </button>
                <small>{entry.slug}</small>
              </td>
              <td>{entry.locale.toUpperCase()}</td>
              <td>
                <span className="badge">{entryStatus(entry)}</span>
              </td>
              <td>{dateLabel(entry.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Pipeline({ status }: { status: Status | null }) {
  return (
    <section className="panel">
      <h2>Kod va kontent yo‘li</h2>
      <div className="pipeline">
        <span>Kompyuter</span>
        <span aria-hidden="true">→</span>
        <a
          href="https://github.com/sardorcodev/sardorcodevuz"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <span aria-hidden="true">→</span>
        <a
          href="https://vercel.com/sardorcodevs/sardorcodevuz"
          target="_blank"
          rel="noopener noreferrer"
        >
          Vercel
        </a>
        <span aria-hidden="true">→</span>
        <a href="/uz" target="_blank" rel="noopener noreferrer">
          Portfolio
        </a>
      </div>
      <p>
        Dizayn va funksiyalar kod orqali yangilanadi. Kontent paneldan Supabase’ga saqlanadi va
        nashr qilishda sayt yangilanadi.
      </p>
      <dl className="status-list">
        <div>
          <dt>Baza</dt>
          <dd>{status?.database === "connected" ? "Ulangan" : "Tekshirilmagan"}</dd>
        </div>
        <div>
          <dt>Muhit</dt>
          <dd>{status?.deployment || "—"}</dd>
        </div>
        <div>
          <dt>Kod versiyasi</dt>
          <dd>
            {status?.commit || "Mahalliy"}
            {status?.branch ? " · " + status.branch : ""}
          </dd>
        </div>
      </dl>
    </section>
  );
}
