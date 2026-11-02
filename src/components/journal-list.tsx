"use client";
import { usePublicSettings } from "./public-settings";
import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/locales";
import { Icon } from "./icon";
import { searchText } from "@/lib/navigation";
export type JournalItem = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  dateLabel: string;
  category: string;
  minutes: number;
  image?: string;
  imageAlt?: string;
};
export function JournalList({ locale, entries }: { locale: Locale; entries: JournalItem[] }) {
  const { copy } = usePublicSettings(),
    d = copy.workshop;
  const [query, setQuery] = useState(""),
    [topic, setTopic] = useState("");
  const words = searchText(query, locale).trim().split(/\s+/).filter(Boolean);
  const categories = new Set(entries.map((entry) => entry.category));
  const filtered = entries.filter(
    (entry) =>
      (!topic || entry.category === topic) &&
      words.every((word) => searchText(entry.title + " " + entry.summary, locale).includes(word)),
  );
  return (
    <>
      <div className="journal-filters">
        <label className="journal-search">
          <span className="sr-only">{d.search}</span>
          <Icon name="search" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={d.searchPlaceholder}
          />
        </label>
        {entries.length > 5 && categories.size > 1 && (
          <label className="journal-topic">
            <span className="sr-only">{d.allTopics}</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">{d.allTopics}</option>
              {Object.entries(d.topics)
                .filter(([key]) => categories.has(key))
                .map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>
      <div className="journal-entries" aria-live="polite">
        {filtered.length ? (
          filtered.map((entry) => (
            <article className="journal-row" key={entry.slug}>
              <time dateTime={entry.date}>{entry.dateLabel}</time>
              <div className="journal-row-copy">
                <h2>
                  <Link href={"/" + locale + "/blog/" + entry.slug}>
                    <span className="marker-link">{entry.title}</span>
                  </Link>
                </h2>
                <p>{entry.summary}</p>
              </div>
              <span className="journal-category">
                {d.topics[entry.category as keyof typeof d.topics]} · {entry.minutes} {d.minutes}
              </span>
              <Link
                href={"/" + locale + "/blog/" + entry.slug}
                className="icon-button"
                aria-label={d.read + ": " + entry.title}
              >
                <Icon name="arrow" />
              </Link>
            </article>
          ))
        ) : (
          <div className="journal-no-results">
            <p>{d.noResults}</p>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setQuery("");
                setTopic("");
              }}
            >
              {d.reset}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
