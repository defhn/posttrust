import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("global CSS does not override Tailwind spacing utilities outside a layer", async () => {
  const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  const universalReset = css.match(/\*,\s*\*::before,\s*\*::after\s*\{([^}]*)\}/s);

  assert.ok(universalReset, "expected the global box-sizing reset to exist");
  assert.doesNotMatch(
    universalReset[1],
    /\b(?:margin|padding)\s*:/,
    "an unlayered universal margin/padding reset overrides Tailwind v4 utilities",
  );
});
