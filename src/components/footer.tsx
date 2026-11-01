import Link from "next/link";
import type { ReactNode } from "react";
import { getPublicWorkshop, getBrand } from "@/lib/cms/settings";
import { getPosts, getProfiles, getProjects } from "@/lib/cms/content";
import { Icon } from "@/components/icon";
import { SocialIcon } from "@/components/social-icon";
import { ExternalLink } from "@/components/ui";
import type { Dictionary } from "@/content/types";
import { localePath, type Locale } from "@/lib/locales";

function Directory({
  title,
  href,
  description,
  children,
}: {
  title: string;
  href: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="footer-directory">
      <h3>
        <Link href={href}>{title}</Link>
      </h3>
      <p>{description}</p>
      <ul>{children}</ul>
    </section>
  );
}

export async function Footer({
  locale,
  dictionary: d,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [brand, w, projects, posts, profiles] = await Promise.all([
    getBrand(),
    getPublicWorkshop(locale),
    getProjects(locale),
    getPosts(locale),
    getProfiles(locale),
  ]);
  const social = profiles.filter((entry) => entry.published.category !== "contact");
  return (
    <footer className="site-footer research-footer">
      <div className="container">
        <div className="footer-social-row">
          <p>{d.footer.follow}</p>
          <ul aria-label={d.common.official}>
            {social.slice(0, 8).map(({ id, published: profile }) => (
              <li key={id}>
                <ExternalLink
                  href={profile.url}
                  label={d.common.newTab}
                  className="footer-social-link"
                >
                  <SocialIcon href={profile.url} />
                  <span className="sr-only">
                    {profile.title} ({profile.handle})
                  </span>
                </ExternalLink>
              </li>
            ))}
          </ul>
          <Link href={localePath(locale, "/official")} className="footer-profile-link">
            {d.common.official}
            <Icon name="arrow" />
          </Link>
        </div>
        <nav className="footer-map" aria-labelledby="footer-explore-title">
          <div className="footer-mission">
            <h2 id="footer-explore-title">{d.footer.explore}</h2>
            <p>{d.common.footerNote}</p>
          </div>
          <div className="footer-map-column">
            <Directory
              title={d.common.projects}
              href={localePath(locale, "/projects")}
              description={d.footer.projectsText}
            >
              {projects.slice(0, 3).map((entry) => (
                <li key={entry.id}>
                  <Link href={localePath(locale, "/projects/" + entry.slug)}>
                    {entry.published.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={localePath(locale, "/projects")}>{d.common.allProjects}</Link>
              </li>
            </Directory>
            <Directory
              title={w.lab}
              href={localePath(locale, "/lab")}
              description={d.footer.labText}
            >
              <li>
                <Link href={localePath(locale, "/lab")}>{w.labCta}</Link>
              </li>
              <li>
                <ExternalLink href={brand.github} label={d.common.newTab}>
                  GitHub
                  <Icon name="external" />
                </ExternalLink>
              </li>
            </Directory>
          </div>
          <div className="footer-map-column">
            <Directory
              title={w.blog}
              href={localePath(locale, "/blog")}
              description={d.footer.journalText}
            >
              {posts.slice(0, 2).map((entry) => (
                <li key={entry.id}>
                  <Link href={localePath(locale, "/blog/" + entry.slug)}>
                    {entry.published.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={localePath(locale, "/blog")}>{w.journalAll}</Link>
              </li>
              <li>
                <ExternalLink href={brand.channel} label={d.common.newTab}>
                  {d.common.channel}
                  <Icon name="external" />
                </ExternalLink>
              </li>
            </Directory>
            <Directory
              title={d.common.official}
              href={localePath(locale, "/official")}
              description={d.footer.profilesText}
            >
              {social.slice(0, 3).map(({ id, published: profile }) => (
                <li key={id}>
                  <ExternalLink href={profile.url} label={d.common.newTab}>
                    {profile.title}
                    <Icon name="external" />
                  </ExternalLink>
                </li>
              ))}
              <li>
                <Link href={localePath(locale, "/official")}>{d.common.official}</Link>
              </li>
            </Directory>
          </div>
          <div className="footer-map-column">
            <Directory
              title={d.common.about}
              href={localePath(locale, "/about")}
              description={d.footer.aboutText}
            >
              <li>
                <Link href={localePath(locale, "/about")}>{d.common.moreAbout}</Link>
              </li>
              <li>
                <Link href={localePath(locale, "/press")}>{d.common.press}</Link>
              </li>
            </Directory>
            <Directory
              title={d.common.contact}
              href={localePath(locale, "/contact")}
              description={d.footer.connectText}
            >
              <li>
                <Link href={localePath(locale, "/contact")}>{d.common.getInTouch}</Link>
              </li>
              <li>
                <a href={"mailto:" + brand.email}>
                  {d.footer.email}
                  <Icon name="mail" />
                </a>
              </li>
              <li>
                <ExternalLink href={brand.telegram} label={d.common.newTab}>
                  {d.footer.telegram}
                  <Icon name="external" />
                </ExternalLink>
              </li>
            </Directory>
          </div>
        </nav>
        <div className="footer-utility">
          <Link
            className="footer-wordmark"
            href={localePath(locale)}
            aria-label={brand.name + " · " + d.common.home}
          >
            {brand.name}
          </Link>
          <nav aria-label={d.common.navigation}>
            <Link href={localePath(locale, "/about")}>{d.common.about}</Link>
            <Link href={localePath(locale, "/official")}>{d.common.official}</Link>
            <Link href={localePath(locale, "/contact")}>{d.common.contact}</Link>
          </nav>
          <a href="#page-top" className="footer-back-top">
            {d.footer.backToTop}
            <Icon name="arrow" />
          </a>
        </div>
        <p className="footer-credit">
          © {new Date().getFullYear()} {brand.name}. {d.common.builtBy}
        </p>
      </div>
    </footer>
  );
}
