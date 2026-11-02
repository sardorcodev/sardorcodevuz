"use client";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePublicSettings } from "./public-settings";
import { Icon } from "./icon";
import { activeDestination, primaryPaths } from "@/lib/public-navigation";
import { garden } from "@/content/garden";
import { GardenArt } from "./garden/art";
import type { NavigationItem } from "@/lib/navigation";
import type { Dictionary } from "@/content/types";
import { localePath, localeNames, switchLocale, type Locale } from "@/lib/locales";
const CommandMenu = dynamic(() => import("./command-menu"));
const languageOrder = ["uz", "en", "ru"] as const;

export function Header({
  locale,
  labels,
  searchItems,
}: {
  locale: Locale;
  labels: Dictionary["common"];
  searchItems: NavigationItem[];
}) {
  const { copy, brand } = usePublicSettings();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const active = activeDestination(pathname);
  const names = [
    labels.home,
    garden[locale].projects,
    copy.workshop.blog,
    labels.about,
    labels.contact,
  ];
  const links = primaryPaths.map((path, i) => ({ path, label: names[i] }));
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        !event.repeat &&
        !event.isComposing &&
        (event.code === "KeyK" || event.key.toLowerCase() === "k")
      ) {
        event.preventDefault();
        setOpen(false);
        setSearchOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  useEffect(() => {
    const node = dialog.current;
    if (!node || !open) return;
    const overflow = document.body.style.overflow;
    const opener = menuButton.current;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, [open]);
  function languageLink(lang: Locale) {
    return (
      <a
        key={lang}
        href={switchLocale(pathname, lang)}
        lang={lang}
        hrefLang={lang}
        aria-label={lang.toUpperCase() + " · " + localeNames[lang]}
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
        {lang.toUpperCase()}
      </a>
    );
  }
  function navigation(mobile = false) {
    return links.map((link) => (
      <Link
        key={link.path}
        href={localePath(locale, link.path)}
        aria-current={active === link.path ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        <GardenArt name="nav-leaf" className="nav-leaf" />
        <span>{link.label}</span>
        {mobile && <Icon name="arrow" />}
      </Link>
    ));
  }
  return (
    <header className="site-header">
      <Link
        href={localePath(locale)}
        className="brand"
        aria-label={brand.name + " · " + labels.home}
      >
        {brand.name === "sardorcodev" ? (
          <Image
            src="/images/garden/reference/wordmark.webp"
            width={202}
            height={69}
            alt={brand.name}
            preload
            unoptimized
            style={{ height: "auto" }}
          />
        ) : (
          <span className="brand-name">{brand.name}</span>
        )}
      </Link>
      <nav className="desktop-nav" aria-label={labels.navigation}>
        {navigation()}
      </nav>
      <a className="sidebar-github" href={brand.github} target="_blank" rel="noopener noreferrer">
        <Icon name="github" />
        GitHub <Icon name="external" />
        <span className="sr-only">{labels.newTab}</span>
      </a>
      <div className="header-tools">
        <nav className="language-inline" aria-label={labels.language}>
          {languageOrder.map(languageLink)}
        </nav>
        <details
          className="language-picker"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.open = false;
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.currentTarget.open = false;
              e.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary
            aria-label={locale.toUpperCase() + " · " + labels.language + ": " + localeNames[locale]}
          >
            {locale.toUpperCase()}
            <Icon name="chevron" />
          </summary>
          <div className="language-options">{languageOrder.map(languageLink)}</div>
        </details>
        <button
          className="icon-button theme-button"
          type="button"
          aria-label={labels.theme}
          title={labels.theme}
          onClick={() => {
            const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            document.documentElement.dataset.theme = next;
            try {
              localStorage.setItem("portfolio-theme", next);
            } catch {}
          }}
        >
          <GardenArt name="sun" className="show-light" />
          <Icon name="moon" className="show-dark" />
        </button>
        <button
          className="icon-button search-trigger"
          type="button"
          aria-label={copy.studio.search}
          aria-keyshortcuts="Control+k Meta+k"
          title={copy.studio.search + " (Ctrl / ⌘ K)"}
          onClick={() => {
            setOpen(false);
            setSearchOpen(true);
          }}
        >
          <Icon name="search" />
        </button>
        <button
          className="icon-button mobile-menu-button"
          type="button"
          ref={menuButton}
          aria-label={open ? labels.closeMenu : labels.openMenu}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(true)}
        >
          <Icon name="menu" />
        </button>
      </div>
      <dialog
        ref={dialog}
        className="mobile-menu"
        aria-label={labels.navigation}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="mobile-menu-heading">
          <span>{brand.name}</span>
          <button
            className="icon-button"
            type="button"
            aria-label={labels.closeMenu}
            onClick={() => setOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <nav id="mobile-nav" aria-label={labels.navigation}>
          {navigation(true)}
        </nav>
        <button
          className="text-link mobile-search"
          type="button"
          onClick={() => {
            setOpen(false);
            setSearchOpen(true);
          }}
        >
          <Icon name="search" />
          {copy.studio.search}
        </button>
      </dialog>
      <noscript>
        <nav className="no-js-nav" aria-label={labels.navigation}>
          {navigation()}
        </nav>
      </noscript>
      {searchOpen && (
        <CommandMenu locale={locale} items={searchItems} onClose={() => setSearchOpen(false)} />
      )}
    </header>
  );
}
