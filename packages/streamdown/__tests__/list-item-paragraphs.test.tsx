/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/list-item-paragraphs.test.tsx @ 072ce7e
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

  it("keeps a custom p component in loose list items", () => {
    const { container } = render(() => (
      <Streamdown components={{ p: (props) => <p class="mine">{props.children}</p> }}>
        {"- hello\n\n- world"}
      </Streamdown>
    ));

    const items = container.querySelectorAll('[data-streamdown="list-item"]');

    expect(items).toHaveLength(2);
    expect([...items].map((item) => item.querySelector("p.mine")?.textContent)).toEqual([
      "hello",
      "world",
    ]);
  });

  it("keeps the paragraph when whitespace other than a line break surrounds it", () => {
    const { container } = render(() => (
      <Streamdown>{"<ul><li> <p>x</p> </li></ul>"}</Streamdown>
    ));

    const item = container.querySelector('[data-streamdown="list-item"]');

    expect(item?.querySelector("p")?.textContent).toBe("x");
  });
});
