import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ExtraProps } from "react-markdown";
import { imagePath } from "@/lib/cms/model";
import type { Locale } from "@/lib/locales";
import { getPublicStudio } from "@/lib/cms/settings";
import { ProjectArt } from "./garden/art";
import { Icon } from "./icon";
import { ContentsNavigation } from "./article-contents";
import {
  headingText,
  remarkHeadings,
  articleHeadings,
  type MarkdownNode,
} from "@/lib/markdown-headings";

async function SectionHeading({
  node,
  children,
  level,
  locale,
}: {
  node?: ExtraProps["node"];
  children: ReactNode;
  level: 2 | 3;
  locale: Locale;
}) {
  const d = await getPublicStudio(locale);
  const Tag = level === 2 ? "h2" : "h3";
  const id = String(node?.properties?.id || "section");
  return (
    <Tag id={id}>
      {children}
      <a
        className="heading-permalink"
        href={"#" + encodeURIComponent(id)}
        aria-label={d.permalink + ": " + (node ? headingText(node as MarkdownNode) : "")}
      >
        <span aria-hidden="true">#</span>
      </a>
    </Tag>
  );
}
export async function ArticleContents({
  body,
  locale,
  isCase = false,
}: {
  body: string;
  locale: Locale;
  isCase?: boolean;
}) {
  const d = await getPublicStudio(locale);
  const headings = articleHeadings(body);
  if (headings.length < 2) return null;
  const label = isCase
    ? { uz: "Shu sahifada", en: "On this page", ru: "На этой странице" }[locale]
    : d.contents;
  return <ContentsNavigation headings={headings} label={label} isCase={isCase} />;
}
export function MarkdownContent({
  body,
  locale = "uz",
  variant,
}: {
  body: string;
  locale?: Locale;
  variant?: "case";
}) {
  return (
    <div className={"prose" + (variant === "case" ? " case-prose" : "")}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkHeadings]}
        skipHtml
        components={{
          h1: ({ children, node }) => (
            <SectionHeading locale={locale} level={2} node={node}>
              {children}
            </SectionHeading>
          ),
          h2: ({ children, node }) => (
            <SectionHeading locale={locale} level={2} node={node}>
              {children}
            </SectionHeading>
          ),
          h3: ({ children, node }) => (
            <SectionHeading locale={locale} level={3} node={node}>
              {children}
            </SectionHeading>
          ),
          a: ({ href, children }) => {
            const project = href?.match(
              /^\/(?:uz|en|ru)\/projects\/(promptpilot|smart-agro-ai|propaint)\/?$/,
            );
            if (project && href)
              return (
                <Link href={href} className="project-inline-link">
                  <ProjectArt slug={project[1]} compact />
                  <span>
                    {children}
                    <Icon name="external" />
                  </span>
                </Link>
              );
            return (
              <a
                href={href}
                rel="noopener noreferrer"
                target={href?.startsWith("https://") ? "_blank" : undefined}
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt }) =>
            typeof src === "string" && src.length > 0 && imagePath.safeParse(src).success ? (
              <Image
                src={src}
                alt={alt || ""}
                width={1200}
                height={800}
                sizes="(max-width: 760px) 90vw, 760px"
              />
            ) : (
              <span>{alt}</span>
            ),
        }}
      >
        {body}
      </Markdown>
    </div>
  );
}
