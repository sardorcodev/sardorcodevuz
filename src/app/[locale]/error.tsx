"use client";
import { usePathname } from "next/navigation";
import { errorMessages } from "@/content/errors";
import { isLocale } from "@/lib/locales";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const value = usePathname().split("/")[1],
    d = errorMessages[isLocale(value) ? value : "en"];
  return (
    <div className="container missing-page">
      <h1>{d.error}</h1>
      <p className="intro-text">{d.errorText}</p>
      <button type="button" className="button button-primary" onClick={reset}>
        {d.retry}
      </button>
    </div>
  );
}
