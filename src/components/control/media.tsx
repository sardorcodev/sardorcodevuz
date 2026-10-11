"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { MediaRow } from "@/lib/control/model";
import { api, dateLabel } from "./api";

type Asset = MediaRow & { url: string };
export function MediaLibrary({ onChoose }: { onChoose?: (url: string) => void }) {
  const [items, setItems] = useState<Asset[]>([]),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let disposed = false;
    api<Asset[]>("media")
      .then((items) => {
        if (!disposed) setItems(items);
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
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 8388608 || file.size < 12)
        throw new Error("JPEG, PNG yoki WebP rasm tanlang; hajmi 8 MB gacha.");
      const prepared = await api<{ id: string; uploadUrl: string }>("media", {
        action: "prepare",
        name: file.name,
        mime: file.type,
        size: file.size,
      });
      const response = await fetch(prepared.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok)
        throw new Error("Rasm yuklanmadi. Ulanishni tekshiring va qayta urinib ko‘ring.");
      const asset = await api<Asset>("media", { action: "complete", id: prepared.id });
      setItems((current) => [asset, ...current]);
      setMessage("Rasm yuklandi.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(item: Asset) {
    if (!window.confirm("Bu rasmni ombordan o‘chirasizmi?")) return;
    setBusy(true);
    setError("");
    try {
      await api("media", { id: item.id }, "DELETE");
      setItems((current) => current.filter((x) => x.id !== item.id));
      setMessage("Rasm o‘chirildi.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel media-library">
      <div className="section-heading">
        <div>
          <h2>Rasmlar kutubxonasi</h2>
          <p>
            JPEG, PNG, WebP · 8 MB gacha. Yuklangan rasmlarning havolasi ommaviy; maxfiy fayllar
            yuklamang.
          </p>
        </div>
        <label className="upload-button">
          {busy ? "Yuklanmoqda…" : "+ Rasm yuklash"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={upload}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {loading ? (
        <p>Rasmlar yuklanmoqda…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">Hozircha rasmlar yo‘q. Birinchi rasmni yuklang.</p>
      ) : (
        <div className="media-grid">
          {items.map((item) => (
            <article key={item.id} className="media-card">
              <Image
                src={item.url}
                alt={item.name}
                width={240}
                height={160}
                loading="lazy"
                unoptimized
              />
              <div>
                <strong>{item.name}</strong>
                <small>
                  {Math.round(item.size / 1024)} KB · {dateLabel(item.created_at)}
                </small>
                <div className="actions">
                  {onChoose ? (
                    <button disabled={busy} className="compact" onClick={() => onChoose(item.url)}>
                      Tanlash
                    </button>
                  ) : (
                    <button
                      disabled={busy}
                      className="secondary compact"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(item.url);
                          setMessage("Havola nusxalandi.");
                        } catch {
                          setError("Havolani nusxalab bo‘lmadi.");
                        }
                      }}
                    >
                      Havolani nusxalash
                    </button>
                  )}
                  <button disabled={busy} className="text-button" onClick={() => void remove(item)}>
                    O‘chirish
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
