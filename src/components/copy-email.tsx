"use client";
import { useState } from "react";
import { Icon } from "@/components/icon";
export function CopyEmail({
  email,
  label,
  success,
  failure,
  compact = false,
}: {
  email: string;
  label: string;
  success: string;
  failure: string;
  compact?: boolean;
}) {
  const [result, setResult] = useState<"idle" | "success" | "failure">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setResult("success");
    } catch {
      setResult("failure");
    }
  }
  return (
    <div className="copy-email">
      <button
        type="button"
        className={compact ? "icon-button" : "button button-secondary"}
        onClick={copy}
        aria-label={compact ? label : undefined}
        title={compact ? label : undefined}
      >
        <Icon name={result === "success" ? "check" : "copy"} />
        <span className={compact ? "sr-only" : undefined}>
          {result === "success" ? success : label}
        </span>
      </button>
      <p className={"copy-status" + (compact ? " sr-only" : "")} role="status" aria-live="polite">
        {result === "success" ? success : result === "failure" ? failure : ""}
      </p>
    </div>
  );
}
