import Link from "next/link";
import "./styles/base.css";
export const metadata = { title: "404 · sardorcodev", robots: { index: false, follow: true } };
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="container missing-page">
          <p className="eyebrow">404 · sardorcodev</p>
          <h1>Page not found.</h1>
          <p className="intro-text">Choose a language to return to the portfolio.</p>
          <div className="button-row">
            <Link href="/en" className="button button-primary" lang="en">
              English
            </Link>
            <Link href="/uz" className="button button-secondary" lang="uz">
              O‘zbekcha
            </Link>
            <Link href="/ru" className="button button-secondary" lang="ru">
              Русский
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
