import { getBrand } from "@/lib/cms/settings";
import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/content/types";
import { garden } from "@/content/garden";
import { localePath, type Locale } from "@/lib/locales";
import { Icon } from "./icon";
import { CopyEmail } from "./copy-email";
import { ExternalLink, PageIntro } from "./ui";
import { GardenArt, type GardenAsset } from "./garden/art";
type Props = { locale: Locale; dictionary: Dictionary };
const universitySource = "https://t.me/s/terdu340/38920";
function contactHandle(url: string, fallback: string) {
  try {
    const handle = new URL(url).pathname.split("/").filter(Boolean)[0];
    return handle ? "@" + handle : fallback;
  } catch {
    return fallback;
  }
}
export async function AboutPage({ locale, dictionary: d }: Props) {
  const brand = await getBrand();
  const icons: GardenAsset[] = ["frontend", "backend", "learning"];
  return (
    <div className="garden-page about-page">
      <div className="about-intro">
        <div>
          <PageIntro label={d.about.label} title={d.about.title} intro={d.about.intro} />
          <div className="bio-copy">
            {d.about.paragraphs.slice(0, 2).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
        <figure className="about-portrait">
          <GardenArt name="portrait-leaf" className="portrait-leaf" />
          <GardenArt name="sprig" className="portrait-sprout" />
          <Image
            src={brand.portrait}
            width={640}
            height={960}
            alt={d.home.portraitAlt}
            sizes="(max-width: 760px) 220px, 300px"
            preload
          />
          <figcaption>{brand.owner}</figcaption>
        </figure>
      </div>
      <section className="skills-section">
        <h2>{d.home.skillsTitle}</h2>
        <div className="skills-list">
          {d.home.skills.map((skill, i) => (
            <article className="skill-row" key={skill.title}>
              <GardenArt name={icons[i]} className="skill-icon" />
              <h3>{skill.title}</h3>
              <div>
                <p>{skill.tags.join(", ")}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="values-section">
        <h2>{d.about.approachTitle}</h2>
        <div className="values-grid">
          {d.about.values.map((value, i) => (
            <article key={value.title}>
              <span className="small-meta">0{i + 1}</span>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="team-section">
        <div className="section-heading-row">
          <h2>{d.about.teamLabel}</h2>
          <span className="small-meta">{d.about.teamTitle}</span>
        </div>
        <div className="team-story">
          <figure>
            <Image
              src={brand.teamImage}
              width={1159}
              height={869}
              sizes="(max-width: 760px) 92vw, 540px"
              alt={d.about.teamImageAlt}
            />
            <figcaption>{d.about.teamCaption}</figcaption>
          </figure>
          <div>
            <p>{d.about.teamText}</p>
            <Link className="text-link" href={localePath(locale, "/press")}>
              {d.about.teamLink}
              <Icon name="external" />
            </Link>
          </div>
        </div>
      </section>
      <section className="about-callout">
        <div>
          <h2>{garden[locale].aboutCta}</h2>
          <p>{garden[locale].aboutCtaText}</p>
          <Link href={localePath(locale, "/contact")} className="button button-primary">
            {d.common.getInTouch}
            <Icon name="external" />
          </Link>
        </div>
        <GardenArt name="plant-books" />
      </section>
    </div>
  );
}
export async function ContactPage({ locale, dictionary: d }: Props) {
  const brand = await getBrand();
  return (
    <div className="garden-page contact-page">
      <div className="contact-main">
        <div>
          <PageIntro label={d.contact.label} title={d.contact.title} intro={d.contact.intro} />
          <section className="contact-method">
            <GardenArt name="envelope" className="contact-method-icon" />
            <div>
              <h2>{d.contact.emailTitle}</h2>
              <a className="email-address" href={"mailto:" + brand.email}>
                {brand.email}
              </a>
              <div className="contact-email-actions">
                <CopyEmail
                  email={brand.email}
                  label={d.common.copyEmail}
                  success={d.common.copied}
                  failure={d.common.copyFailed}
                />
                <a className="button button-primary" href={"mailto:" + brand.email}>
                  {d.footer.email}
                  <Icon name="external" />
                </a>
              </div>
            </div>
          </section>
          <section className="contact-method contact-telegram">
            <GardenArt name="plane" className="contact-method-icon" />
            <div>
              <h2>{d.contact.telegramTitle}</h2>
              <p className="contact-handle">{contactHandle(brand.telegram, brand.name)}</p>
              <p className="telegram-note">{d.contact.telegramText}</p>
              <ExternalLink
                href={brand.telegram}
                className="button button-secondary"
                label={d.common.newTab}
              >
                {d.footer.telegram}
                <Icon name="external" />
              </ExternalLink>
            </div>
          </section>
        </div>
        <GardenArt name="mailbox" className="contact-art" eager />
      </div>
      <div className="contact-notes">
        <section>
          <GardenArt name="sprig" className="contact-note-icon" />
          <h2>{d.contact.lookingTitle}</h2>
          <p>{d.contact.lookingItems.join(" ")}</p>
        </section>
        <section>
          <GardenArt name="note-pencil" className="contact-note-icon" />
          <h2>{d.contact.helpfulTitle}</h2>
          <p>{d.contact.helpfulText}</p>
        </section>
      </div>
      <div className="contact-elsewhere">
        <section>
          <Icon name="github" />
          <h2>{garden[locale].codeTitle}</h2>
          <ExternalLink href={brand.github} label={d.common.newTab} className="text-link">
            GitHub
            <Icon name="external" />
          </ExternalLink>
        </section>
        <section>
          <GardenArt name="plane" />
          <h2>{garden[locale].updatesTitle}</h2>
          <ExternalLink href={brand.channel} label={d.common.newTab} className="text-link">
            {brand.name} {d.common.channel}
            <Icon name="external" />
          </ExternalLink>
        </section>
      </div>
    </div>
  );
}
export async function PressPage({ locale, dictionary: d }: Props) {
  const brand = await getBrand();
  return (
    <div className="garden-page press-page">
      <PageIntro label={d.press.label} title={d.press.title} intro={d.press.intro} />
      <div className="press-source">
        <figure>
          <Image
            src={brand.teamImage}
            width={1159}
            height={869}
            sizes="(max-width: 760px) 92vw, 740px"
            alt={d.about.teamImageAlt}
            preload
          />
          <figcaption>{d.about.teamCaption}</figcaption>
        </figure>
        <section>
          <h2>
            <GardenArt name="prompt-compact" />
            {garden[locale].publicSource}
          </h2>
          <h3>{d.press.sourceTitle}</h3>
          <p>{d.press.sourceKind}</p>
          <p className="source-url">
            {garden[locale].sourceLabel}
            <br />
            <a href={universitySource} target="_blank" rel="noopener noreferrer">
              t.me/s/terdu340/38920 <Icon name="external" />
            </a>
          </p>
          <ExternalLink
            href={universitySource}
            label={d.common.newTab}
            className="button button-primary"
          >
            {d.common.source}
            <Icon name="external" />
          </ExternalLink>
        </section>
      </div>
      <p className="press-summary">{d.press.sourceText}</p>
      <div className="press-roles">
        <section>
          <h2>{garden[locale].result}</h2>
          <p>{garden[locale].teamResult}</p>
        </section>
        <section>
          <h2>{garden[locale].contribution}</h2>
          <p>{d.press.note}</p>
        </section>
      </div>
      <div className="press-bottom">
        <Link className="text-link" href={localePath(locale, "/projects/smart-agro-ai")}>
          <GardenArt name="sprout-compact" />
          {d.press.projectLink}
          <Icon name="arrow" />
        </Link>
        <Link href={localePath(locale, "/about")} className="back-link">
          {d.common.about}
          <Icon name="arrow" />
        </Link>
      </div>
    </div>
  );
}
