import { getBrand, getPublicDictionary, getPublicWorkshop } from "@/lib/cms/settings";
import { getProfiles } from "@/lib/cms/content";
import { type Locale } from "@/lib/locales";
import { PageIntro, ExternalLink } from "../ui";
import { SocialIcon } from "../social-icon";
import { Icon } from "../icon";
import { GardenArt } from "./art";
import { CopyEmail } from "../copy-email";
export async function ManagedProfilesPage({ locale }: { locale: Locale }) {
  const [brand, d, w, entries] = await Promise.all([
    getBrand(),
    getPublicDictionary(locale),
    getPublicWorkshop(locale),
    getProfiles(locale),
  ]);
  const labels = {
    code: w.profileCode,
    social: w.profileSocial,
    contact: w.profileContact,
  };
  return (
    <div className="garden-page profiles-page">
      <div className="profiles-intro">
        <PageIntro label={w.profileLabel} title={w.profileTitle} intro={w.profileIntro} />
        <GardenArt name="signpost" />
      </div>
      {Object.entries(labels).map(([category, label]) => {
        const profiles = entries.filter(({ published: profile }) => {
          if (profile.url === brand.telegram) return false;
          const group = profile.url === brand.channel ? "code" : profile.category;
          return (group === "video" ? "social" : group) === category;
        });
        return profiles.length || category === "contact" ? (
          <section className="profile-group" key={category}>
            <h2>
              {label}
              <Icon name="leaf" />
            </h2>
            {profiles.map(({ id, published: p }) => (
              <ExternalLink href={p.url} label={d.common.newTab} className="profile-row" key={id}>
                <SocialIcon href={p.url} />
                <h3>{p.title}</h3>
                <p>{p.summary}</p>
                <span className="profile-handle">{p.handle}</span>
                <Icon name="external" className="profile-row-arrow" />
              </ExternalLink>
            ))}
            {category === "contact" && (
              <>
                <div className="profile-row profile-email-row">
                  <Icon name="mail" />
                  <h3>
                    <a href={"mailto:" + brand.email}>Email</a>
                  </h3>
                  <p>{locale === "uz" ? "Takliflar va hamkorlik uchun" : d.contact.emailText}</p>
                  <span className="profile-handle">{brand.email}</span>
                  <CopyEmail
                    email={brand.email}
                    label={d.common.copyEmail}
                    success={d.common.copied}
                    failure={d.common.copyFailed}
                    compact
                  />
                  <a
                    href={"mailto:" + brand.email}
                    className="icon-button"
                    aria-label={d.footer.email}
                  >
                    <Icon name="external" />
                  </a>
                </div>
                <ExternalLink href={brand.telegram} label={d.common.newTab} className="profile-row">
                  <SocialIcon href={brand.telegram} />
                  <h3>{locale === "uz" ? "Telegram shaxsiy" : "Telegram"}</h3>
                  <p>{locale === "uz" ? "Shaxsiy xabarlar uchun" : d.contact.telegramText}</p>
                  <span className="profile-handle">
                    @{new URL(brand.telegram).pathname.replace(/^\/+|\/+$/g, "")}
                  </span>
                  <Icon name="external" className="profile-row-arrow" />
                </ExternalLink>
              </>
            )}
          </section>
        ) : null;
      })}
      {!entries.length && <p>{w.profileEmpty}</p>}
    </div>
  );
}
