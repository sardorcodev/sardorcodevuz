"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePublicSettings } from "./public-settings";
/** Optional progressive enhancement: content is always visible, including without JS. */
export function PageMotion() {
  const pathname = usePathname(),
    { brand } = usePublicSettings();
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!brand.animation || preference.matches || !Element.prototype.animate) return;
    const animations: Animation[] = [];
    document.querySelectorAll(".garden-hero-copy, .hero-workspace, .page-intro").forEach((node) => {
      animations.push(
        node.animate([{ transform: "translateY(8px)" }, { transform: "translateY(0)" }], {
          duration: 280,
          easing: "ease-out",
        }),
      );
    });
    const stop = () => animations.forEach((animation) => animation.cancel());
    const change = () => {
      if (preference.matches) stop();
    };
    preference.addEventListener("change", change);
    return () => {
      stop();
      preference.removeEventListener("change", change);
    };
  }, [pathname, brand.animation]);
  return null;
}
