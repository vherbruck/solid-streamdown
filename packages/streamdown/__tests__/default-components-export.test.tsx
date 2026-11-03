/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/default-components-export.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { defaultComponents, Streamdown } from "../index";

describe("defaultComponents export", () => {
  it("exports the built-in component map from the package root", () => {
    expect(defaultComponents).toBeTruthy();
    // Upstream's comment about memo() objects does not apply: Solid
    // components are plain functions.
    expect(defaultComponents.h2).toBeTruthy();
    expect(defaultComponents.code).toBeTruthy();
    expect(defaultComponents.pre).toBeTruthy();
  });

  it("exports the link component", () => {
    expect((defaultComponents as unknown as Record<string, unknown>).a).toBeTruthy();
  });

  it("preserves default styles when composing through an override", () => {
    const DefaultH2 = defaultComponents.h2!;

    const { container } = render(() => (
      <Streamdown
        components={{
          h2: (props: { class?: string; children?: JSX.Element }) => (
            <DefaultH2 {...props} class={`${props.class ?? ""} text-blue-500`} />
          ),
        }}
      >
        {"## Hello"}
      </Streamdown>
    ));

    const heading = container.querySelector("h2");
    expect(heading).toBeTruthy();
    expect(heading?.getAttribute("data-streamdown")).toBe("heading-2");
    expect(heading?.className).toContain("mt-6");
    expect(heading?.className).toContain("mb-2");
    expect(heading?.className).toContain("font-semibold");
    expect(heading?.className).toContain("text-2xl");
    expect(heading?.className).toContain("text-blue-500");
    expect(heading?.textContent).toBe("Hello");
  });

  it("supports Dynamic composition for conditional overrides", () => {
    const DefaultA = (defaultComponents as unknown as Record<string, any>).a;
    const { container } = render(() => (
      <Streamdown
        components={{
          a: (props: { href?: string }) =>
            props.href === "https://example.com/override" ? (
              <a {...props}>overridden</a>
            ) : (
              <Dynamic component={DefaultA} {...props} />
            ),
        }}
        linkSafety={{ enabled: false }}
      >
        {
          "[default link](https://example.com) and [custom](https://example.com/override)"
        }
      </Streamdown>
    ));

    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]?.getAttribute("data-streamdown")).toBe("link");
    expect(links[0]?.textContent).toBe("default link");
    expect(links[1]?.textContent).toBe("overridden");
    expect(links[1]?.getAttribute("data-streamdown")).toBeNull();
  });
});
