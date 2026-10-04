"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { workshop } from "@/content/workshop";
import { Icon } from "@/components/icon";
import {
  locales,
  localeCodes,
  localeNames,
  localePath,
  switchLocale,
  type Locale,
} from "@/lib/locales";
import type { Dictionary } from "@/content/types";
export function Header({ locale, labels }: { locale: Locale; labels: Dictionary["common"] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const links = [
    { path: "/projects", label: labels.projects },
    { path: "/blog", label: workshop[locale].blog },
    { path: "/lab", label: workshop[locale].lab },
    { path: "/about", label: labels.about },
    { path: "/contact", label: labels.contact },
  ];
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  function changeTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("portfolio-theme", next);
    } catch {}
  }
  return (
    <header className="site-header" ref={header}>
      <div className="container header-row">
        <Link
          href={localePath(locale)}
          className="brand"
          aria-label={"sardorcodev · " + labels.home}
          onClick={() => setOpen(false)}
        >
          <span className="brand-symbol" aria-hidden="true">
            s<span>.</span>
          </span>
          <span className="brand-name">
            sardorcodev<span>.</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label={labels.navigation}>
          {links.map((link) => (
            <Link
              key={link.path}
              href={localePath(locale, link.path)}
              aria-current={pathname.startsWith(localePath(locale, link.path)) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <details
            className="language-picker"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                event.currentTarget.open = false;
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}
          >
            <summary aria-label={labels.language + ": " + localeNames[locale]}>
              <Icon name="globe" />
              <span>{localeCodes[locale]}</span>
              <Icon name="chevron" className="small-icon" />
            </summary>
            <div className="language-options">
              {locales.map((lang) => (
                <a
                  key={lang}
                  href={switchLocale(pathname, lang)}
                  hrefLang={lang}
                  lang={lang}
                  aria-current={lang === locale ? "true" : undefined}
                  onClick={(event) => {
                    try {
                      document.cookie =
                        "portfolio-locale=" + lang + "; Path=/; Max-Age=31536000; SameSite=Lax";
                    } catch {}
                    event.currentTarget.href =
                      switchLocale(pathname, lang) + window.location.search + window.location.hash;
                  }}
                >
                  {localeNames[lang]}
                  {lang === locale && <Icon name="check" />}
                </a>
              ))}
            </div>
          </details>
          <button
            type="button"
            className="icon-button theme-button"
            onClick={changeTheme}
            aria-label={labels.theme}
            title={labels.theme}
          >
            <Icon name="moon" className="show-light" />
            <Icon name="sun" className="show-dark" />
          </button>
          <button
            type="button"
            className="icon-button mobile-menu-button"
            ref={menuButton}
            onClick={() => setOpen(!open)}
            aria-label={open ? labels.closeMenu : labels.openMenu}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
      <nav
        id="mobile-nav"
        className="container mobile-nav"
        aria-label={labels.navigation}
        hidden={!open}
      >
        {links.map((link) => (
          <Link
            key={link.path}
            href={localePath(locale, link.path)}
            onClick={() => setOpen(false)}
            aria-current={pathname.startsWith(localePath(locale, link.path)) ? "page" : undefined}
          >
            {link.label}
            <Icon name="arrow" />
          </Link>
        ))}
      </nav>
    </header>
  );
}
