import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./control.css";
export const metadata: Metadata = {
  title: "Control · sardorcodev",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <a className="control-skip" href="#control-main">
          Asosiy qismga o‘tish
        </a>
        {children}
      </body>
    </html>
  );
}
