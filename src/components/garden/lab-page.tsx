import Link from "next/link";
import { getPublicDictionary, getPublicWorkshop } from "@/lib/cms/settings";
import { getProjects } from "@/lib/cms/content";
import { type Locale, localePath } from "@/lib/locales";
import { DrawingBoard } from "../drawing-board";
import { PageIntro } from "../ui";
import { Icon } from "../icon";
import { GardenArt } from "./art";
export async function LabPage({ locale }: { locale: Locale }) {
  const [d, w, projects] = await Promise.all([
    getPublicDictionary(locale),
    getPublicWorkshop(locale),
    getProjects(locale),
  ]);
  const hasProPaint = projects.some((p) => p.slug === "propaint");
  return (
    <div className="garden-page lab-page">
      <PageIntro label={w.labLabel} title={w.labTitle} intro={w.labIntro} />
      <section aria-label={w.canvasTitle} className="lab-experiment">
        <DrawingBoard locale={locale} />
      </section>
      <section className="lab-source">
        <GardenArt name="palette" />
        <div>
          <p>{w.labSource}</p>
          <Link
            href={localePath(locale, hasProPaint ? "/projects/propaint" : "/projects")}
            className="text-link"
          >
            {hasProPaint ? "ProPaint" : d.common.allProjects}
            <Icon name="arrow" />
          </Link>
        </div>
        <p className="lab-description">
          {locale === "uz" ? "Brauzerda ishlaydigan rasm muharririm." : d.projects.propaint.summary}
        </p>
        <GardenArt name="lab-notebook" className="lab-notebook" />
      </section>
    </div>
  );
}
