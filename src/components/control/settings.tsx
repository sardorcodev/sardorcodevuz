"use client";
import { useState } from "react";
import {
  baseCopy,
  flattenCopy,
  globalDefaults,
  type AuthState,
  type SettingsRow,
} from "@/lib/control/model";
import { api, download } from "./api";
import { History } from "./editor";
import { MediaLibrary } from "./media";
import { useDraft } from "./use-draft";

const labels: Record<keyof typeof globalDefaults, string> = {
  name: "Brend nomi",
  owner: "Ism va familiya",
  email: "Aloqa emaili",
  github: "GitHub profili",
  telegram: "Shaxsiy Telegram",
  channel: "Telegram kanali",
  portrait: "Shaxsiy rasm",
  teamImage: "Jamoa rasmi",
  animation: "Bosh sahifada zarrachalar animatsiyasi",
};
export function SettingsEditor({
  initial,
  onUpdate,
}: {
  initial: SettingsRow;
  onUpdate: (row: SettingsRow) => void;
}) {
  const editor = useDraft(
    initial,
    { target: "settings", key: initial.key },
    (result) => result.settings,
    onUpdate,
  );
  const { row, draft, setDraft, busy, dirty, error, conflict, mutate } = editor;
  const [search, setSearch] = useState(""),
    [section, setSection] = useState("all"),
    [assetField, setAssetField] = useState<"portrait" | "teamImage" | null>(null),
    [localError, setLocalError] = useState("");
  const defaults = row.key === "global" ? globalDefaults : flattenCopy(baseCopy(row.key));
  function reset(key: string) {
    const next = { ...draft };
    delete next[key];
    setDraft(next);
  }
  const keys = Object.keys(defaults).filter(
    (key) =>
      (section === "all" || key.startsWith(section + ".")) &&
      (key + " " + String(draft[key] ?? (defaults as Record<string, unknown>)[key]))
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>
            {row.key === "global" ? "Brend va aloqa" : "Sahifa matnlari · " + row.key.toUpperCase()}
          </h2>
          <p>
            Faqat o‘zingiz o‘zgartirgan maydonlar panelda saqlanadi. Qolganlari koddagi yangi
            versiyani oladi.
          </p>
        </div>
        <span className="save-status" role="status">
          {busy ? "Saqlanmoqda…" : dirty ? "Saqlanmagan tahrir" : "Qoralama saqlangan"}
        </span>
      </div>
      {(error || localError) && (
        <p role="alert" className="notice error">
          {error || localError}
        </p>
      )}
      {conflict && (
        <div className="notice">
          <p>Sozlama boshqa oynada o‘zgargan.</p>
          <div className="actions">
            <button className="secondary" onClick={editor.backup}>
              Tahrirni yuklab olish
            </button>
            <button
              onClick={async () => {
                if (!window.confirm("Saqlanmagan tahrir o‘rniga bazadagi nusxani ochasizmi?"))
                  return;
                try {
                  const latest = (await api<SettingsRow[]>("settings")).find(
                    (x) => x.key === row.key,
                  );
                  if (latest) editor.reload(latest);
                } catch (e) {
                  setLocalError((e as Error).message);
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
          disabled={busy || conflict}
          onClick={() => void mutate("save")}
        >
          Saqlash · Ctrl S
        </button>
        <button
          disabled={busy || conflict}
          onClick={() => {
            if (window.confirm("Bu sozlamalarni ommaviy saytga nashr qilasizmi?"))
              void mutate("publish");
          }}
        >
          Saytga nashr qilish
        </button>
        {row.published && (
          <button
            className="text-button"
            disabled={busy || conflict}
            onClick={() => {
              if (
                window.confirm(
                  "Paneldagi nashr qilingan sozlamalarni olib, koddagi qiymatlarni tiklaysizmi? Qoralamangiz saqlanadi.",
                )
              )
                void mutate("unpublish");
            }}
          >
            Koddagi sozlamalarni qaytarish
          </button>
        )}
      </div>
      {row.key !== "global" && (
        <div className="filters">
          <label>
            Qidirish
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Maydon yoki matn…"
            />
          </label>
          <label>
            Bo‘lim
            <select value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="all">Barcha matnlar</option>
              <option value="dictionary">Asosiy sahifalar</option>
              <option value="workshop">Ustaxona va navigatsiya</option>
              <option value="studio">Interaktiv qismlar</option>
            </select>
          </label>
          <span>{keys.length} maydon</span>
        </div>
      )}
      <div className="form-grid panel">
        {keys.map((key) => {
          const overridden = Object.hasOwn(draft, key);
          const value = draft[key] ?? (defaults as Record<string, unknown>)[key];
          return (
            <label key={key} className={row.key !== "global" ? "full copy-field" : undefined}>
              <span className="field-heading">
                {row.key === "global" ? labels[key as keyof typeof globalDefaults] : key}
                <small className={overridden ? "badge" : "muted"}>
                  {overridden ? "Panel qiymati" : "Koddan"}
                </small>
              </span>
              {typeof value === "boolean" ? (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                />
              ) : row.key === "global" ? (
                <input
                  type={key === "email" ? "email" : "text"}
                  value={String(value)}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  maxLength={1000}
                />
              ) : (
                <textarea
                  rows={String(value).length > 160 ? 4 : 2}
                  maxLength={6000}
                  value={String(value)}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                />
              )}
              {overridden && (
                <button
                  className="text-button"
                  type="button"
                  disabled={busy}
                  onClick={() => reset(key)}
                >
                  Koddagi qiymatga qaytarish
                </button>
              )}
              {(key === "portrait" || key === "teamImage") && (
                <button className="text-button" onClick={() => setAssetField(key)}>
                  Kutubxonadan rasm tanlash
                </button>
              )}
            </label>
          );
        })}
        {keys.length === 0 && <p>Qidiruvga mos maydon topilmadi.</p>}
      </div>
      {assetField && (
        <MediaLibrary
          onChoose={(url) => {
            setDraft({ ...draft, [assetField]: url });
            setAssetField(null);
          }}
        />
      )}
      <History
        key={row.revision}
        target="settings"
        id={row.key}
        disabled={busy || conflict}
        onRestore={(id) => void mutate("restore", { versionId: id })}
      />
    </section>
  );
}

export function SecuritySettings({ onState }: { onState: (state: AuthState) => void }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function password(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("newPassword") !== data.get("confirmPassword")) {
      setError("Yangi parollar bir xil emas.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      onState(
        await api("auth/password", {
          currentPassword: data.get("currentPassword"),
          newPassword: data.get("newPassword"),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel">
        <h2>Xavfsizlik</h2>
        <p>
          <span className="badge">Authenticator faol</span> Panel faqat egasining tasdiqlangan
          hisobiga ochiq.
        </p>
        <p>
          Parol almashtirilgach, boshqa qurilmalardagi sessiyalar ham tugatiladi. Qayta kirish kerak
          bo‘ladi.
        </p>
        <form className="form-grid" onSubmit={password}>
          <label>
            Amaldagi parol
            <input
              required
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              maxLength={256}
            />
          </label>
          <label>
            Yangi parol
            <input
              required
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
            />
            <small>Kamida 12 belgi.</small>
          </label>
          <label>
            Yangi parolni takrorlash
            <input
              required
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
            />
          </label>
          <div className="full">
            <button disabled={busy}>Parolni almashtirish</button>
          </div>
        </form>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
      </section>
      <section className="panel">
        <h2>Zaxira nusxa</h2>
        <p>
          Blog, loyihalar, profillar, qoralamalar va sozlamalarni JSON faylga yuklab oling.
          Rasmlarning o‘zi bu faylga kirmaydi.
        </p>
        <button
          className="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              download(
                await api("export"),
                "sardorcodev-kontent-" + new Date().toISOString().slice(0, 10) + ".json",
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Kontentni eksport qilish
        </button>
      </section>
    </>
  );
}
