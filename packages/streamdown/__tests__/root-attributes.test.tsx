/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/root-attributes.test.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

const markdown = "Hello **world**\n\nSecond paragraph";

describe("data-* and aria-* props", () => {
  for (const mode of ["static", "streaming"] as const) {
    it(`are set on the root element in ${mode} mode`, () => {
      const { container } = render(() => (
        <Streamdown
          aria-busy="true"
          aria-label="Assistant reply"
          class="custom-class"
          data-message-id="42"
          mode={mode}
        >
          {markdown}
        </Streamdown>
      ));

      const root = container.firstElementChild as HTMLElement;
      expect(root.getAttribute("data-message-id")).toBe("42");
      expect(root.getAttribute("aria-label")).toBe("Assistant reply");
      expect(root.getAttribute("aria-busy")).toBe("true");
      expect(root.className).toContain("custom-class");
      expect(container.querySelectorAll("[data-message-id]")).toHaveLength(1);
    });
  }

  it("update on the root when only an attribute changes", () => {
    const [state, setState] = createSignal("streaming");
    const { container } = render(() => (
      <Streamdown data-state={state()}>{markdown}</Streamdown>
    ));
    setState("done");

    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-state")).toBe("done");
  });

  it("are removed from the root when no longer passed", () => {
    const [attributes, setAttributes] = createSignal<{ "data-state"?: string }>({
      "data-state": "streaming",
    });
    const { container } = render(() => (
      <Streamdown {...attributes()}>{markdown}</Streamdown>
    ));
    const root = container.firstElementChild as HTMLElement;
    // Precondition (not upstream): the attribute is there before removal
    expect(root.getAttribute("data-state")).toBe("streaming");
    setAttributes({});

    expect(root.hasAttribute("data-state")).toBe(false);
  });
});
