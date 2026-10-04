import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { imagePath } from "@/lib/cms/model";

export function MarkdownContent({ body }: { body: string }) {
  return (
    <div className="prose">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
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
