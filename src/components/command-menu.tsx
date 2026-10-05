"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/locales";
import { filterNavigation, type NavigationItem } from "@/lib/navigation";
import { studio } from "@/content/studio";
import { Icon } from "./icon";
import styles from "./command-menu.module.css";

export default function CommandMenu({
  locale,
  items,
  onClose,
}: {
  locale: Locale;
  items: NavigationItem[];
  onClose: () => void;
}) {
  const d = studio[locale];
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [query, setQuery] = useState("");
  const filtered = filterNavigation(items, query, locale);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    input.current?.focus();
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true });
    };
  }, []);
  function move(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = Array.from(
      dialog.current?.querySelectorAll<HTMLAnchorElement>("[data-command-result]") || [],
    );
    if (!links.length) return;
    event.preventDefault();
    const active = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next =
      active < 0
        ? event.key === "ArrowDown"
          ? 0
          : links.length - 1
        : (active + (event.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
    links[next].focus();
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={id + "-title"}
      aria-describedby={id + "-hint"}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={move}
    >
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">sardorcodev / workspace</p>
          <h2 id={id + "-title"}>{d.search}</h2>
        </div>
        <button type="button" className="icon-button" aria-label={d.close} onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <p id={id + "-hint"} className={styles.hint}>
        {d.searchHint}
      </p>
      <div className={styles.search}>
        <Icon name="search" />
        <label className="sr-only" htmlFor={id + "-input"}>
          {d.search}
        </label>
        <input
          ref={input}
          id={id + "-input"}
          type="search"
          value={query}
          autoComplete="off"
          spellCheck={false}
          placeholder={d.searchPlaceholder}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              dialog.current?.querySelector<HTMLAnchorElement>("[data-command-result]")?.click();
            }
          }}
        />
      </div>
      <div className={styles.results}>
        {(["pages", "projects", "posts"] as const).map((group) => {
          const matches = filtered.filter((item) => item.group === group);
          return matches.length ? (
            <section key={group} aria-labelledby={id + "-" + group}>
              <h3 id={id + "-" + group}>{d[group]}</h3>
              <ul>
                {matches.map((item) => (
                  <li key={item.href}>
                    <Link data-command-result href={item.href} onClick={onClose} prefetch={false}>
                      <span className={styles.resultIcon}>
                        <Icon
                          name={
                            group === "projects" ? "code" : group === "posts" ? "book" : "arrow"
                          }
                        />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <span className={styles.description}>{item.description}</span>
                      </span>
                      <Icon name="arrow" className={styles.arrow} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null;
        })}
        {!filtered.length && (
          <div className={styles.empty}>
            <Icon name="search" />
            <p>{d.noResults}</p>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setQuery("");
                input.current?.focus();
              }}
            >
              {d.clear}
            </button>
          </div>
        )}
      </div>
      <footer className={styles.footer}>
        <span role="status" aria-live="polite">
          {filtered.length} {d.results}
        </span>
        <span className={styles.keys}>
          <span>
            <kbd>↑↓</kbd> {d.move}
          </span>
          <span>
            <kbd>↵</kbd> {d.open}
          </span>
          <span>
            <kbd>esc</kbd> {d.dismiss}
          </span>
        </span>
      </footer>
    </dialog>
  );
}
