"use client";
import { useState } from "react";
import { Icon } from "@/components/icon";
export function CopyEmail({
  email,
  label,
  success,
  failure,
}: {
  email: string;
  label: string;
  success: string;
  failure: string;
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
      <button type="button" className="button button-secondary" onClick={copy}>
        <Icon name={result === "success" ? "check" : "copy"} />
        {result === "success" ? success : label}
      </button>
      <p className="copy-status" role="status" aria-live="polite">
        {result === "success" ? success : result === "failure" ? failure : ""}
      </p>
    </div>
  );
}
