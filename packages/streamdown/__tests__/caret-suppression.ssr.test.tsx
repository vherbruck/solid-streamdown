/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/caret-suppression.test.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { renderToString } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

const CARET_CLASS = "after:content-[var(--streamdown-caret)]";

// Effects do not run on the server, so the attribute cannot be there to
// suppress anything and the markup has to omit the caret instead. Without
// this, a document ending in a table ships a caret that only disappears once
// hydration runs.
describe("caret suppression on the server", () => {
  it("omits the caret when the last block is a table", () => {
    const markup = renderToString(() => (
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>
    ));

    expect(markup).not.toContain(CARET_CLASS);
  });

  it("omits the caret while a code fence is incomplete", () => {
    const markup = renderToString(() => (
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;"}
      </Streamdown>
    ));

    expect(markup).not.toContain(CARET_CLASS);
  });

  it("keeps the caret after ordinary prose", () => {
    const markup = renderToString(() => (
      <Streamdown caret="block" isAnimating={true}>
        {"Just some prose."}
      </Streamdown>
    ));

    expect(markup).toContain(CARET_CLASS);
  });
});
