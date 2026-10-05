import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ExtraProps } from "react-markdown";
import { imagePath } from "@/lib/cms/model";
import type { Locale } from "@/lib/locales";
import { studio } from "@/content/studio";
import {
  headingText,
  remarkHeadings,
  articleHeadings,
  type MarkdownNode,
} from "@/lib/markdown-headings";

function SectionHeading({
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
  const Tag = level === 2 ? "h2" : "h3";
  const id = String(node?.properties?.id || "section");
  return (
    <Tag id={id}>
      {children}
      <a
        className="heading-permalink"
        href={"#" + encodeURIComponent(id)}
        aria-label={
          studio[locale].permalink + ": " + (node ? headingText(node as MarkdownNode) : "")
        }
      >
        <span aria-hidden="true">#</span>
      </a>
    </Tag>
  );
}
export function ArticleContents({ body, locale }: { body: string; locale: Locale }) {
  const headings = articleHeadings(body);
  if (headings.length < 2) return null;
  return (
    <nav className="article-contents" aria-label={studio[locale].contents}>
      <details open>
        <summary>{studio[locale].contents}</summary>
        <ol>
          {headings.map((heading) => (
            <li key={heading.id} data-level={heading.level}>
              <Link href={"#" + encodeURIComponent(heading.id)} prefetch={false}>
                {heading.title}
              </Link>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}
export function MarkdownContent({ body, locale = "uz" }: { body: string; locale?: Locale }) {
  return (
    <div className="prose">
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
          a: ({ href, children }) => (
            <a
              href={href}
              rel="noopener noreferrer"
              target={href?.startsWith("https://") ? "_blank" : undefined}
            >
              {children}
            </a>
          ),
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
