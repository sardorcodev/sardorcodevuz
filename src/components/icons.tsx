type IconName = "arrow" | "check" | "code" | "facebook" | "instagram" | "mail" | "send" | "spark" | "telegram" | "workflow" | "x" | "youtube";

export function Icon({ name, className = "size-5" }: { name: IconName | string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    code: <><path d="m8 9-3 3 3 3"/><path d="m16 9 3 3-3 3"/><path d="m14 5-4 14"/></>,
    facebook: <path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v6h4v-6h3.5l.5-4h-4V9a1 1 0 0 1 1-1Z"/>,
    instagram: <><rect width="16" height="16" x="4" y="4" rx="4"/><circle cx="12" cy="12" r="3"/><path d="M17.5 6.5h.01"/></>,
    mail: <><rect width="18" height="14" x="3" y="5" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    spark: <><path d="m12 3-1.9 5.1L5 10l5.1 1.9L12 17l1.9-5.1L19 10l-5.1-1.9Z"/><path d="m5 18-.7 1.3L3 20l1.3.7L5 22l.7-1.3L7 20l-1.3-.7Z"/></>,
    telegram: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    workflow: <><rect width="6" height="6" x="3" y="3" rx="1"/><rect width="6" height="6" x="15" y="15" rx="1"/><path d="M9 6h4a3 3 0 0 1 3 3v6"/><path d="m13 12 3 3 3-3"/></>,
    x: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    youtube: <><path d="M2.5 12c0-2.3.2-3.8.5-4.7.2-.7.8-1.3 1.5-1.5C5.7 5.5 8.2 5.5 12 5.5s6.3 0 7.5.3c.7.2 1.3.8 1.5 1.5.3.9.5 2.4.5 4.7s-.2 3.8-.5 4.7c-.2.7-.8 1.3-1.5 1.5-1.2.3-3.7.3-7.5.3s-6.3 0-7.5-.3c-.7-.2-1.3-.8-1.5-1.5-.3-.9-.5-2.4-.5-4.7Z"/><path d="m10 9 5 3-5 3Z"/></>,
  };
  return <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">{paths[name]}</svg>;
}
