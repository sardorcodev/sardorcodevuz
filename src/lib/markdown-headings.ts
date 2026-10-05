import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

export type MarkdownNode = {
  type: string;
  depth?: number;
  value?: string;
  alt?: string;
  children?: MarkdownNode[];
  data?: { hProperties?: Record<string, unknown> };
};
export type ArticleHeading = { id: string; title: string; level: number };
export function headingText(node: MarkdownNode): string {
  if (node.type === "image") return node.alt || "";
  return node.value ?? node.children?.map(headingText).join("") ?? "";
}
function decorate(tree: MarkdownNode) {
  const headings: ArticleHeading[] = [];
  const ids = new Set<string>();
  function walk(node: MarkdownNode) {
    if (node.type === "heading") {
      const title = headingText(node);
      const slug = title
        .toLowerCase()
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/\s+/g, "-");
      const base = "section-" + (slug || "heading");
      let id = base,
        suffix = 2;
      while (ids.has(id)) id = base + "-" + suffix++;
      ids.add(id);
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
      if (node.depth && node.depth <= 3)
        headings.push({ id, title, level: Math.max(2, node.depth) });
    }
    node.children?.forEach(walk);
  }
  walk(tree);
  return headings;
}
export function remarkHeadings() {
  return (tree: MarkdownNode) => {
    decorate(tree);
  };
}
export function articleHeadings(body: string) {
  return decorate(unified().use(remarkParse).use(remarkGfm).parse(body) as MarkdownNode);
}
