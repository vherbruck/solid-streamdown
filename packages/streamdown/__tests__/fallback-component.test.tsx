/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/fallback-component.test.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { type JSX, type ParentProps, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { ExtraProps } from "../lib/markdown";

type FallbackProps = Record<string, unknown> & ExtraProps;

/**
 * A minimal pass-through renderer: renders the element using its own tag
 * name with any props passed down by the renderer.
 */
const PassThrough = (props: FallbackProps) => {
  const [local, rest] = splitProps(props, ["node", "children"]);
  return (
    <Dynamic
      component={local.node?.tagName ?? "span"}
      {...rest}
      data-fallback="true"
    >
      {local.children as JSX.Element}
    </Dynamic>
  );
};

describe("fallbackComponent prop", () => {
  describe("allowedTags without explicit component", () => {
    it("uses fallbackComponent for an allowedTags tag with no component entry", () => {
      const { container } = render(() => (
        <Streamdown
          allowedTags={{ mention: [] }}
          fallbackComponent={PassThrough}
          mode="static"
        >
          {"<mention>@alice</mention>"}
        </Streamdown>
      ));

      // PassThrough renders the original tag; verify data-fallback attribute
      const el = container.querySelector("mention");
      expect(el).toBeTruthy();
      expect(el?.getAttribute("data-fallback")).toBe("true");
      expect(el?.textContent).toBe("@alice");
    });

    it("uses fallbackComponent for multiple allowedTags without components", () => {
      const { container } = render(() => (
        <Streamdown
          allowedTags={{ tag1: [], tag2: [] }}
          fallbackComponent={PassThrough}
          mode="static"
        >
          {"<tag1>first</tag1> <tag2>second</tag2>"}
        </Streamdown>
      ));

      const tag1 = container.querySelector("tag1");
      const tag2 = container.querySelector("tag2");
      expect(tag1?.getAttribute("data-fallback")).toBe("true");
      expect(tag2?.getAttribute("data-fallback")).toBe("true");
    });
  });

  describe("explicit components take precedence", () => {
    it("explicit component wins over fallbackComponent", () => {
      const ExplicitTag = (props: FallbackProps) => (
        <span data-explicit="true">{props.children as JSX.Element}</span>
      );

      const { container } = render(() => (
        <Streamdown
          allowedTags={{ mention: [] }}
          components={{ mention: ExplicitTag }}
          fallbackComponent={PassThrough}
          mode="static"
        >
          {"<mention>@bob</mention>"}
        </Streamdown>
      ));

      // Explicit component is used, not PassThrough
      const explicit = container.querySelector('[data-explicit="true"]');
      expect(explicit).toBeTruthy();
      expect(explicit?.textContent).toBe("@bob");

      // data-fallback should NOT be present
      const fallback = container.querySelector('[data-fallback="true"]');
      expect(fallback).toBeNull();
    });

    it("explicit p component overrides fallbackComponent for paragraph", () => {
      const CustomP = (props: ParentProps) => (
        <p data-custom="true">{props.children}</p>
      );

      const { container } = render(() => (
        <Streamdown
          components={{ p: CustomP as any }}
          fallbackComponent={PassThrough}
          mode="static"
        >
          {"Hello world"}
        </Streamdown>
      ));

      const p = container.querySelector('[data-custom="true"]');
      expect(p).toBeTruthy();
      // fallbackComponent must not have been used for <p>
      const fallback = container.querySelector('[data-fallback="true"]');
      expect(fallback).toBeNull();
    });
  });

  describe("HTML tags not in defaultComponents", () => {
    it("uses fallbackComponent for tags absent from the default map (e.g. <span>)", () => {
      const { container } = render(() => (
        <Streamdown fallbackComponent={PassThrough} mode="static">
          {"<span>inline span</span>"}
        </Streamdown>
      ));

      const span = container.querySelector('[data-fallback="true"]');
      expect(span).toBeTruthy();
      expect(span?.textContent).toContain("inline span");
    });
  });

  describe("built-in components still win with fallbackComponent set", () => {
    it("still uses the built-in h1 (Tailwind classes) when fallbackComponent is set", () => {
      const { container } = render(() => (
        <Streamdown fallbackComponent={PassThrough} mode="static">
          {"# Hello"}
        </Streamdown>
      ));

      const h1 = container.querySelector("h1");
      expect(h1).toBeTruthy();
      expect(h1?.className).toContain("font-semibold");
      // Must not have been rendered via the fallback
      expect(h1?.getAttribute("data-fallback")).toBeNull();
      expect(container.querySelector('[data-fallback="true"]')).toBeNull();
    });
  });

  describe("backward compatibility", () => {
    it("applies built-in Tailwind classes when fallbackComponent is absent", () => {
      const { container } = render(() => (
        <Streamdown mode="static">{"# Hello"}</Streamdown>
      ));

      const h1 = container.querySelector("h1");
      expect(h1).toBeTruthy();
      expect(h1?.className).toContain("font-semibold");
    });

    it("does not add data-fallback when fallbackComponent is absent", () => {
      const { container } = render(() => (
        <Streamdown mode="static">{"Hello **world**"}</Streamdown>
      ));

      const fallback = container.querySelector('[data-fallback="true"]');
      expect(fallback).toBeNull();
    });
  });

  describe("streaming mode", () => {
    it("applies fallbackComponent in streaming mode for allowedTags", () => {
      const { container } = render(() => (
        <Streamdown
          allowedTags={{ chip: [] }}
          fallbackComponent={PassThrough}
          mode="streaming"
        >
          {"<chip>label</chip>"}
        </Streamdown>
      ));

      const chip = container.querySelector("chip");
      expect(chip).toBeTruthy();
      expect(chip?.getAttribute("data-fallback")).toBe("true");
    });
  });

  describe("node prop passthrough", () => {
    it("receives node with tagName in fallbackComponent", () => {
      const tagNames: string[] = [];
      const Inspector = (props: FallbackProps) => {
        if (props.node?.tagName) {
          tagNames.push(props.node.tagName);
        }
        return (
          <Dynamic component={props.node?.tagName ?? "span"}>
            {props.children as JSX.Element}
          </Dynamic>
        );
      };

      render(() => (
        <Streamdown
          allowedTags={{ badge: [] }}
          fallbackComponent={Inspector}
          mode="static"
        >
          {"<badge>x</badge>"}
        </Streamdown>
      ));

      expect(tagNames).toContain("badge");
    });
  });
});
