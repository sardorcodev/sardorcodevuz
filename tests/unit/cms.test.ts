import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { validateContent } from "../../src/lib/cms/model";
import { seedEntries } from "../../src/lib/cms/seed";
import { previewToken, verifyPreviewToken } from "../../src/lib/cms/preview-token";
import { imageType } from "../../src/lib/control/media";
process.env.CMS_PREVIEW_SECRET = "local-unit-preview-secret-123456789";
test("preview links are bound to entry, revision and a short expiry", () => {
  const id = randomUUID(),
    now = 1791100800000;
  const token = previewToken(id, 3, now);
  assert.equal(verifyPreviewToken(id, token, now), 3);
  assert.equal(verifyPreviewToken(randomUUID(), token, now), null);
  assert.equal(verifyPreviewToken(id, token.replace("3.", "4."), now), null);
  assert.equal(verifyPreviewToken(id, token, now + 1801000), null);
  assert.equal(verifyPreviewToken(id, ""), null);
});
test("all migrated content is valid and no journal entry is silently published", () => {
  const entries = seedEntries();
  assert.equal(entries.length, 27);
  for (const entry of entries)
    assert.doesNotThrow(() => validateContent(entry.kind, entry.published));
  assert.equal(
    entries.some((e) => e.kind === "post"),
    false,
  );
  assert.equal(
    entries.some((e) => JSON.stringify(e).includes("[object Object]")),
    false,
  );
});
test("unsafe public links, executable images and incomplete articles cannot publish", () => {
  assert.throws(() =>
    validateContent("profile", {
      title: "X",
      summary: "My public account",
      url: "javascript:alert(1)",
      handle: "@test",
      category: "social",
    }),
  );
  assert.throws(() =>
    validateContent("post", {
      title: "A post",
      summary: "A short summary",
      body: "<script>x</script>",
      category: "work",
      image: "data:image/svg+xml,test",
      imageAlt: "test",
    }),
  );
  assert.throws(() => validateContent("post", { title: "A post" }));
  assert.throws(() => imageType(Buffer.from("<svg onload='alert(1)'>")));
});
