import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/content/types";
import { localePath, type Locale } from "@/lib/locales";
import { site } from "@/lib/site";
import { Icon, type IconName } from "@/components/icon";
import { CopyEmail } from "@/components/copy-email";
import { ContactCallout, ExternalLink, Eyebrow, PageIntro, Tags } from "@/components/ui";
type Props = { locale: Locale; dictionary: Dictionary };
const universitySource = "https://t.me/s/terdu340/38920";

function Skills({ d }: { d: Dictionary }) {
  const icons: IconName[] = ["code", "server", "spark"];
  return (
    <section className="section skills-section">
      <div className="section-heading">
        <Eyebrow>{d.home.skillsLabel}</Eyebrow>
        <h2>{d.home.skillsTitle}</h2>
        <p>{d.home.skillsIntro}</p>
      </div>
      <div className="skills-grid">
        {d.home.skills.map((skill, i) => (
          <article key={skill.title} className="skill">
            <span className="skill-icon">
              <Icon name={icons[i]} />
            </span>
            <h3>{skill.title}</h3>
            <p>{skill.text}</p>
            <Tags items={skill.tags} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function AboutPage({ locale, dictionary: d }: Props) {
  return (
    <div className="container">
      <PageIntro label={d.about.label} title={d.about.title} intro={d.about.intro} />
      <div className="bio-grid">
        <div className="prose">
          {d.about.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <Link href={localePath(locale, "/contact")} className="text-link">
            {d.common.getInTouch}
            <Icon name="arrow" />
          </Link>
        </div>
        <figure className="about-portrait">
          <Image
            src="/images/portrait.webp"
            width={640}
            height={960}
            alt={d.home.portraitAlt}
            sizes="(max-width: 760px) 80vw, 300px"
          />
          <figcaption>{d.home.portraitNote}</figcaption>
        </figure>
      </div>
      <Skills d={d} />
      <section className="section">
        <div className="section-heading">
          <Eyebrow>{d.about.approachLabel}</Eyebrow>
          <h2>{d.about.approachTitle}</h2>
        </div>
        <div className="values-grid">
          {d.about.values.map((value, i) => (
            <article key={value.title}>
              <span className="value-number" aria-hidden="true">
                0{i + 1}
              </span>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section team-section">
        <div>
          <Eyebrow>{d.about.teamLabel}</Eyebrow>
          <h2>{d.about.teamTitle}</h2>
          <p>{d.about.teamText}</p>
          <Link className="text-link" href={localePath(locale, "/press")}>
            {d.about.teamLink}
            <Icon name="arrow" />
          </Link>
        </div>
        <figure>
          <Image
            src="/images/green-ops.webp"
            width={1159}
            height={869}
            sizes="(max-width: 760px) 90vw, 520px"
            alt={d.about.teamImageAlt}
          />
          <figcaption>{d.about.teamCaption}</figcaption>
        </figure>
      </section>
      <ContactCallout locale={locale} dictionary={d} />
    </div>
  );
}

export function ContactPage({ dictionary: d }: Props) {
  return (
    <div className="container">
      <PageIntro label={d.contact.label} title={d.contact.title} intro={d.contact.intro} />
      <div className="contact-grid">
        <section className="contact-email">
          <span className="contact-icon">
            <Icon name="mail" />
          </span>
          <h2>{d.contact.emailTitle}</h2>
          <p>{d.contact.emailText}</p>
          <a className="email-address" href={"mailto:" + site.email}>
            {site.email}
          </a>
          <CopyEmail
            email={site.email}
            label={d.common.copyEmail}
            success={d.common.copied}
            failure={d.common.copyFailed}
          />
        </section>
        <section className="contact-card">
          <Icon name="telegram" />
          <h2>{d.contact.telegramTitle}</h2>
          <p>{d.contact.telegramText}</p>
          <ExternalLink href={site.telegram} className="text-link" label={d.common.newTab}>
            @sardorbek_musurmonov
            <Icon name="external" />
          </ExternalLink>
        </section>
        <section className="contact-card">
          <Icon name="github" />
          <h2>{d.contact.githubTitle}</h2>
          <p>{d.contact.githubText}</p>
          <ExternalLink href={site.github} className="text-link" label={d.common.newTab}>
            @sardorcodev
            <Icon name="external" />
          </ExternalLink>
        </section>
        <section className="contact-card">
          <Icon name="telegram" />
          <h2>{d.contact.channelTitle}</h2>
          <p>{d.contact.channelText}</p>
          <ExternalLink href={site.channel} className="text-link" label={d.common.newTab}>
            @sardorcodev
            <Icon name="external" />
          </ExternalLink>
        </section>
      </div>
      <div className="section contact-notes">
        <section>
          <h2>{d.contact.lookingTitle}</h2>
          <ul className="check-list">
            {d.contact.lookingItems.map((item) => (
              <li key={item}>
                <Icon name="check" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>{d.contact.helpfulTitle}</h2>
          <p>{d.contact.helpfulText}</p>
        </section>
      </div>
    </div>
  );
}

export function PressPage({ locale, dictionary: d }: Props) {
  return (
    <div className="container">
      <PageIntro label={d.press.label} title={d.press.title} intro={d.press.intro} />
      <figure className="press-image">
        <Image
          src="/images/green-ops.webp"
          width={1159}
          height={869}
          sizes="(max-width: 900px) 90vw, 850px"
          alt={d.about.teamImageAlt}
        />
        <figcaption>{d.about.teamCaption}</figcaption>
      </figure>
      <section className="source-card">
        <Eyebrow>{d.press.sourceKind}</Eyebrow>
        <h2>{d.press.sourceTitle}</h2>
        <p>{d.press.sourceText}</p>
        <ExternalLink href={universitySource} label={d.common.newTab} className="text-link">
          {d.common.source}
          <Icon name="external" />
        </ExternalLink>
      </section>
      <p className="press-note">{d.press.note}</p>
      <Link className="text-link" href={localePath(locale, "/projects/smart-agro-ai")}>
        {d.press.projectLink}
        <Icon name="arrow" />
      </Link>
      <ContactCallout locale={locale} dictionary={d} />
    </div>
  );
}
