"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePublicSettings } from "./public-settings";

/** Content stays visible without JavaScript; animation never owns its final style. */
export function PageMotion() {
  const pathname = usePathname();
  const { brand } = usePublicSettings();
  useEffect(() => {
    if (!brand.animation || !window.IntersectionObserver || !Element.prototype.animate) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        let stagger = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (preference.matches || document.hidden) continue;
          const base = getComputedStyle(entry.target).transform;
          const transform = base === "none" ? "" : base;
          const animation = entry.target.animate(
            [
              { opacity: 0.2, transform: "translateY(20px) " + transform },
              { opacity: 1, transform: "translateY(0) " + transform },
            ],
            {
              duration: 560,
              delay: Math.min(stagger++ * 60, 120),
              easing: "cubic-bezier(.2,.7,.25,1)",
            },
          );
          animations.add(animation);
          void animation.finished.then(
            () => animations.delete(animation),
            () => animations.delete(animation),
          );
        }
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(
        ".research-headline > span, .research-butterfly, .research-browser, .page-intro, .article-intro, .editorial-project-grid > article, .editorial-journal-grid > .journal-row, .research-statement-scene, .research-work .section-heading, .research-work .projects-grid > article, .research-journal .section-heading, .research-news-card, .research-explore-intro, .research-explore-grid, .research-future-grid > article, .contact-callout, .footer-mission, .footer-map-column",
      )
      .forEach((node) => observer.observe(node));
    const stop = () => {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const changed = () => {
      if (preference.matches) {
        observer.disconnect();
        stop();
      }
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    preference.addEventListener("change", changed);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      stop();
      preference.removeEventListener("change", changed);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [pathname, brand.animation]);
  return null;
}
