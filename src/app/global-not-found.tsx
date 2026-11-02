import Image from "next/image";
import Link from "next/link";
import { GardenArt } from "@/components/garden/art";
import "./styles/foundation.css";
import "./styles/garden.css";
export const metadata = { title: "404 · sardorcodev", robots: { index: false, follow: true } };
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="global-missing">
          <Link href="/en">
            <Image
              src="/images/garden/reference/wordmark.webp"
              alt="sardorcodev"
              width={202}
              height={69}
              unoptimized
              style={{ height: "auto" }}
            />
          </Link>
          <div className="missing-page">
            <div>
              <p className="eyebrow">404 · sardorcodev</p>
              <h1>This page took a different path.</h1>
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
            </div>
            <GardenArt name="gate" eager />
          </div>
        </main>
      </body>
    </html>
  );
}
