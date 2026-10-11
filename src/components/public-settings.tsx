"use client";
import { createContext, useContext } from "react";
import type { PublicCopy, Brand } from "@/lib/cms/public-model";
const Context = createContext<{ copy: PublicCopy; brand: Brand } | null>(null);
export function PublicSettingsProvider({
  children,
  copy,
  brand,
}: {
  children: React.ReactNode;
  copy: PublicCopy;
  brand: Brand;
}) {
  return <Context.Provider value={{ copy, brand }}>{children}</Context.Provider>;
}
export function usePublicSettings() {
  const context = useContext(Context);
  if (!context) throw new Error("Public settings provider is missing");
  return context;
}
