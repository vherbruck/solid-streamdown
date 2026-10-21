/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/list-item-paragraphs.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("list item paragraph wrapping", () => {
  it("does not keep paragraph wrappers for loose list items", () => {
    const markdown = `
## Test

- hello

- world
`;
    const { container } = render(() => <Streamdown>{markdown}</Streamdown>);

    const items = container.querySelectorAll('[data-streamdown="list-item"]');

    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.querySelector("p")).toBeNull();
    }
  });
});
