import assert from "node:assert/strict";
import { test } from "node:test";
import { activeDestination, primaryPaths } from "../../src/lib/public-navigation";
test("five primary destinations keep secondary pages in their parent section", () => {
  assert.equal(primaryPaths.length, 5);
  for (const locale of ["uz", "en", "ru"]) {
    assert.equal(activeDestination("/" + locale), "");
    assert.equal(activeDestination("/" + locale + "/projects/propaint"), "/projects");
    assert.equal(activeDestination("/" + locale + "/lab"), "/projects");
    assert.equal(activeDestination("/" + locale + "/blog/hello"), "/blog");
    assert.equal(activeDestination("/" + locale + "/press"), "/about");
    assert.equal(activeDestination("/" + locale + "/official"), "/contact");
  }
});
test("404s and similarly named paths never highlight a misleading destination", () => {
  for (const path of ["/de", "/uz/unknown", "/en/projects-archive", "/ru/blogroll", "/control"]) {
    assert.equal(activeDestination(path), null, path);
  }
});
