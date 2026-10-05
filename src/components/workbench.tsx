"use client";
import { useId, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/locales";
import { localePath } from "@/lib/locales";
import { workshop } from "@/content/workshop";
import { studio } from "@/content/studio";
import { Icon } from "./icon";

export function Workbench({
  locale,
  projectSlugs,
  fallbackLabel,
}: {
  locale: Locale;
  projectSlugs: string[];
  fallbackLabel: string;
}) {
  const [active, setActive] = useState(0);
  const id = useId();
  const d = workshop[locale];
  const links = [
    localePath(locale, projectSlugs.includes("propaint") ? "/projects/propaint" : "/projects"),
    localePath(
      locale,
      projectSlugs.includes("promptpilot") ? "/projects/promptpilot" : "/projects",
    ),
    "https://github.com/sardorcodev/ml-learning",
  ];
  const labels = [
    projectSlugs.includes("propaint") ? d.deskLinks[0] : fallbackLabel,
    projectSlugs.includes("promptpilot") ? d.deskLinks[1] : fallbackLabel,
    d.deskLinks[2],
  ];
  return (
    <section className="workbench" aria-label={d.deskTitle}>
      <div className="workbench-chrome">
        <span aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>sardorcodev / workspace</span>
        <Icon name="spark" />
      </div>
      <div className="workbench-tabs" role="tablist" aria-label={d.deskTitle}>
        {d.deskTabs.map((tab, index) => (
          <button
            key={tab}
            id={id + "-tab-" + index}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls={id + "-panel"}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              let next = active;
              if (event.key === "ArrowRight") next = (active + 1) % 3;
              else if (event.key === "ArrowLeft") next = (active + 2) % 3;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = 2;
              else return;
              event.preventDefault();
              setActive(next);
              document.getElementById(id + "-tab-" + next)?.focus();
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div
        className="workbench-panel"
        id={id + "-panel"}
        role="tabpanel"
        aria-labelledby={id + "-tab-" + active}
        tabIndex={0}
      >
        <div className={"workbench-art art-" + active} aria-hidden="true">
          {active === 0 ? (
            <>
              <div className="mini-browser">
                <span />
                <span />
                <span />
                <div className="mini-layout">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <span className="art-sticker">{"</>"}</span>
            </>
          ) : active === 1 ? (
            <>
              <span className="flow-node">UI</span>
              <span className="flow-line">↔</span>
              <span className="flow-node">API</span>
              <span className="flow-line">↔</span>
              <span className="flow-node">DB</span>
            </>
          ) : (
            <>
              <div className="learning-bars">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <span className="art-sticker">f(x)</span>
            </>
          )}
        </div>
        <div className="workbench-skillline">{studio[locale].deskSkills[active]}</div>
        <p>{d.deskNotes[active]}</p>
        <Link href={links[active]} className="text-link">
          {labels[active]}
          <Icon name="arrow" />
        </Link>
      </div>
      <div className="workbench-foot">
        <span className="status-dot" />
        {d.deskFooter}
        <span aria-hidden="true">✳</span>
      </div>
    </section>
  );
}
