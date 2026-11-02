"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GardenArt } from "./garden/art";

type Heading = { id: string; title: string; level: number };
export function ContentsNavigation({
  headings,
  label,
  isCase = false,
}: {
  headings: Heading[];
  label: string;
  isCase?: boolean;
}) {
  const [active, setActive] = useState<string | undefined>(headings[0]?.id);
  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((e): e is HTMLElement => Boolean(e));
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const passed = elements.filter((e) => e.getBoundingClientRect().top <= 160);
      const atBottom =
        window.scrollY > 4 &&
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      setActive(atBottom ? elements.at(-1)?.id : passed.at(-1)?.id || headings[0]?.id);
    };
    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };
    const fromHash = () => {
      let id = "";
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {}
      if (headings.some((h) => h.id === id)) setActive(id);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", fromHash);
    fromHash();
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [headings]);
  const list = (
    <ol>
      {headings.map((heading) => (
        <li key={heading.id} data-level={heading.level}>
          <Link
            href={"#" + encodeURIComponent(heading.id)}
            prefetch={false}
            aria-current={active === heading.id ? "location" : undefined}
            onClick={() => setActive(heading.id)}
          >
            {heading.title}
          </Link>
        </li>
      ))}
    </ol>
  );
  return (
    <>
      <nav className="article-contents desktop-contents" aria-label={label}>
        <p className="contents-title">
          {!isCase && <GardenArt name="sprig" />}
          {label}
        </p>
        {list}
      </nav>
      <nav className="article-contents mobile-contents" aria-label={label}>
        <details>
          <summary>{label}</summary>
          {list}
        </details>
      </nav>
    </>
  );
}
