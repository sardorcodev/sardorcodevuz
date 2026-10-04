"use client";
import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/locales";
import { workshop } from "@/content/workshop";
import { Icon } from "./icon";

export type JournalItem = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  dateLabel: string;
  category: string;
  minutes: number;
};
export function JournalList({ locale, entries }: { locale: Locale; entries: JournalItem[] }) {
  const d = workshop[locale];
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const filtered = entries.filter(
    (entry) =>
      (!topic || entry.category === topic) &&
      (entry.title + " " + entry.summary)
        .toLocaleLowerCase(locale)
        .includes(query.toLocaleLowerCase(locale).trim()),
  );
  return (
    <>
      <div className="journal-filters">
        <label className="journal-search">
          <span>{d.search}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={d.searchPlaceholder}
          />
        </label>
        <label className="journal-topic">
          <span>{d.allTopics}</span>
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="">{d.allTopics}</option>
            {Object.entries(d.topics).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="journal-entries" aria-live="polite">
        {filtered.length ? (
          filtered.map((entry, i) => (
            <article className="journal-row" key={entry.slug}>
              <div className="journal-date">
                <span className="journal-index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <time dateTime={entry.date}>{entry.dateLabel}</time>
              </div>
              <div>
                <div className="journal-category">
                  {d.topics[entry.category as keyof typeof d.topics]} · {entry.minutes} {d.minutes}
                </div>
                <h2>
                  <Link href={"/" + locale + "/blog/" + entry.slug}>
                    {entry.title}
                    <Icon name="arrow" />
                  </Link>
                </h2>
                <p>{entry.summary}</p>
              </div>
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
