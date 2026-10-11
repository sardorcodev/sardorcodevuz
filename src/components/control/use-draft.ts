"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { fingerprint } from "@/lib/control/model";
import { api, ApiError, download } from "./api";

type Editable = { revision: number; draft: Record<string, unknown> };
// One write at a time; a completed autosave must never replace newer keystrokes.
export function useDraft<T extends Editable>(
  initial: T,
  target: Record<string, unknown>,
  extract: (result: Record<string, T>) => T,
  onUpdate: (value: T) => void,
) {
  const [row, setRow] = useState(initial),
    [draft, setDraft] = useState(initial.draft),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [conflict, setConflict] = useState(false);
  const current = useRef({ row, draft }),
    writing = useRef(false),
    blocked = useRef(false),
    callbacks = useRef({ target, extract, onUpdate });
  useLayoutEffect(() => {
    current.current = { row, draft };
    callbacks.current = { target, extract, onUpdate };
  }, [row, draft, target, extract, onUpdate]);
  const dirty = fingerprint(row.draft) !== fingerprint(draft);
  const mutate = useCallback(async (op: string, extras: Record<string, unknown> = {}) => {
    if (writing.current || (blocked.current && op !== "reload")) return false;
    writing.current = true;
    setBusy(true);
    setError("");
    const snapshot = current.current,
      request = {
        requestId: crypto.randomUUID(),
        ...callbacks.current.target,
        op,
        revision: snapshot.row.revision,
        ...(["save", "publish"].includes(op) ? { draft: snapshot.draft } : {}),
        ...extras,
      };
    try {
      let result: Record<string, T>;
      try {
        result = await api("mutate", request);
      } catch (e) {
        if (e instanceof ApiError) throw e;
        result = await api("mutate", request);
      }
      const next = callbacks.current.extract(result);
      const latestDraft = current.current.draft;
      const nextDraft =
        op === "restore" ||
        op === "unarchive" ||
        (["save", "publish"].includes(op) &&
          fingerprint(latestDraft) === fingerprint(snapshot.draft))
          ? next.draft
          : latestDraft;
      current.current = { row: next, draft: nextDraft };
      setRow(next);
      setDraft(nextDraft);
      callbacks.current.onUpdate(next);
      return true;
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError && e.status === 409) {
        blocked.current = true;
        setConflict(true);
      }
      return false;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }, []);
  // Do not repeatedly retry a failed save: preserve the draft and wait for manual retry.
  useEffect(() => {
    if (!dirty || busy || error || conflict) return;
    const timer = setTimeout(() => void mutate("save"), 1800);
    return () => clearTimeout(timer);
  }, [draft, dirty, busy, error, conflict, mutate]);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (fingerprint(current.current.row.draft) !== fingerprint(current.current.draft)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        void mutate("save");
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("keydown", shortcut);
    };
  }, [mutate]);
  function reload(next: T) {
    blocked.current = false;
    setConflict(false);
    setError("");
    setRow(next);
    setDraft(next.draft);
    callbacks.current.onUpdate(next);
  }
  return {
    row,
    draft,
    setDraft,
    dirty,
    busy,
    error,
    conflict,
    mutate,
    reload,
    backup: () =>
      download(
        { ...callbacks.current.target, revision: row.revision, draft },
        "saqlanmagan-tahrir.json",
      ),
  };
}
