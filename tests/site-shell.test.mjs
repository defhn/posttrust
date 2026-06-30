import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("site header and footer use centered inner containers", async () => {
  const [header, footer] = await Promise.all([
    readFile(new URL("../src/components/site-header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/site-footer.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(header, /max-w-6xl mx-auto/);
  assert.match(footer, /max-w-6xl mx-auto/);
});

test("footer links to real legal routes instead of hash placeholders", async () => {
  const footer = await readFile(new URL("../src/components/site-footer.tsx", import.meta.url), "utf8");

  assert.match(footer, /href="\/privacy"/);
  assert.match(footer, /href="\/terms"/);
  assert.doesNotMatch(footer, /href="#"/);
});
