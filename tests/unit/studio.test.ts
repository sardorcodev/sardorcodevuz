import test from "node:test";
import assert from "node:assert/strict";
import { filterNavigation, type NavigationItem } from "../../src/lib/navigation";
import { articleHeadings } from "../../src/lib/markdown-headings";

test("navigation search accepts apostrophe variants, accents and multiple words", () => {
  const items: NavigationItem[] = [
    { href: "/uz/about", title: "O‘rganish yo‘lim", description: "Python va ML", group: "pages" },
    {
      href: "/uz/projects/propaint",
      title: "ProPaint",
      description: "Canvas muharriri",
      group: "projects",
    },
    { href: "/ru/about", title: "Изучаю машинное обучение", description: "Python", group: "pages" },
    { href: "/en/blog/cafe", title: "Café notes", description: "Learning", group: "posts" },
  ];
  assert.equal(filterNavigation(items, "o'rganish python", "uz")[0].href, "/uz/about");
  assert.equal(filterNavigation(items, "OʻRGANISH", "uz").length, 1);
  assert.equal(filterNavigation(items, "МАШИННОЕ python", "ru")[0].href, "/ru/about");
  assert.equal(filterNavigation(items, "cafe", "en")[0].href, "/en/blog/cafe");
  assert.equal(filterNavigation(items, "canvas database", "uz").length, 0);
});
test("article contents follow parsed Markdown, including repeated and Unicode headings", () => {
  const body =
    "# O‘rganish\n\n## Birinchi *qadam*\n\n```md\n## Not a heading\n```\n\n## Birinchi qadam\n\n### Русский раздел\n\n## heading\n\n## heading-2\n\n## heading";
  const headings = articleHeadings(body);
  assert.equal(headings.length, 7);
  assert.ok(!headings.some((heading) => heading.title.includes("Not a heading")));
  assert.equal(headings[1].title, "Birinchi qadam");
  assert.notEqual(headings[1].id, headings[2].id);
  assert.equal(headings[3].title, "Русский раздел");
  assert.equal(new Set(headings.map((heading) => heading.id)).size, headings.length);
});
