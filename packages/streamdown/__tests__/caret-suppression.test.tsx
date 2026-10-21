/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/caret-suppression.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { CustomRendererProps } from "../lib/plugin-types";

const SUPPRESSION_ATTRIBUTE = /:not\(\[([a-z-]+)\]\)/;

const streamdownContainer = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement | null;

// The attribute is read out of the shipped class rather than written here, so a
// rename that reaches only one of the two fails instead of passing vacuously.
const suppressionAttribute = (container: HTMLElement) => {
  const className = streamdownContainer(container)?.className ?? "";
  const match = SUPPRESSION_ATTRIBUTE.exec(className);
  if (!match) {
    throw new Error(
      `no suppression attribute in container class: ${className}`
    );
  }
  return match[1];
};

const isCaretSuppressed = (container: HTMLElement) =>
  streamdownContainer(container)?.lastElementChild?.hasAttribute(
    suppressionAttribute(container)
  ) ?? false;

const caretVariable = (container: HTMLElement) =>
  streamdownContainer(container)?.style.getPropertyValue("--streamdown-caret");

const VegaRenderer = (props: CustomRendererProps) => (
  <div data-testid="vega-renderer">Vega Chart: {props.code}</div>
);

describe("caret suppression", () => {
  it("suppresses the caret while a code fence is incomplete", () => {
    const { container } = render(() => (
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;"}
      </Streamdown>
    ));

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("restores the caret once the code fence completes", () => {
    const [text, setText] = createSignal("```javascript\nconst x = 1;");
    const { container } = render(() => (
      <Streamdown caret="block" isAnimating={true}>
        {text()}
      </Streamdown>
    ));

    expect(isCaretSuppressed(container)).toBe(true);

    setText("```javascript\nconst x = 1;\n```");

    expect(isCaretSuppressed(container)).toBe(false);
  });

  it("suppresses the caret when the last block is a table", () => {
    const { container } = render(() => (
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>
    ));

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("suppresses the caret while a table is still streaming", () => {
    const { container } = render(() => (
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |"}
      </Streamdown>
    ));

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("shows the caret when a table is followed by regular text", () => {
    const { container } = render(() => (
      <Streamdown caret="block" isAnimating={true}>
        {
          "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n\nText after the table"
        }
      </Streamdown>
    ));

    expect(isCaretSuppressed(container)).toBe(false);
  });

  it("shows the caret after a completed code block", () => {
    const { container } = render(() => (
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;\n```"}
      </Streamdown>
    ));

    expect(isCaretSuppressed(container)).toBe(false);
  });

  it("suppresses the caret when blocks are wrapped for text direction", () => {
    const { container } = render(() => (
      <Streamdown caret="block" dir="auto" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>
    ));

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("clears the mark from a block that is no longer last", () => {
    const table = "| Name | Age |\n| --- | --- |\n| Alice | 30 |";
    const [text, setText] = createSignal(table);
    const { container } = render(() => (
      <Streamdown caret="block" isAnimating={true}>
        {text()}
      </Streamdown>
    ));

    const tableElement = streamdownContainer(container)?.lastElementChild;
    expect(tableElement?.hasAttribute(suppressionAttribute(container))).toBe(
      true
    );

    setText(`${table}\n\nText after.`);

    expect(tableElement?.hasAttribute(suppressionAttribute(container))).toBe(
      false
    );
  });

  it("does not mark anything when the caret is not animating", () => {
    const { container } = render(() => (
      <Streamdown caret="block" isAnimating={false}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>
    ));

    expect(isCaretSuppressed(container)).toBe(false);
  });

  // Suppression is derived from the block's markdown source, so it holds for
  // markup Streamdown did not render. A rule selecting Streamdown's own
  // data-streamdown markers would miss every case below, because the consumer's
  // component replaces the element carrying the marker.
  describe("with consumer-supplied renderers", () => {
    // plan 2: custom fence renderers (plugins.renderers) render through the
    // code-block component, which does not exist yet
    it.skip("suppresses the caret under a custom fence renderer", () => {
      const { container } = render(() => (
        <Streamdown
          caret="block"
          isAnimating={true}
          plugins={{
            renderers: [{ language: "vega-lite", component: VegaRenderer }],
          }}
        >
          {'```vega-lite\n{"mark": "bar"}'}
        </Streamdown>
      ));

      expect(
        container.querySelector('[data-testid="vega-renderer"]')
      ).toBeTruthy();
      expect(isCaretSuppressed(container)).toBe(true);
    });

    it("suppresses the caret under a replaced table component", () => {
      const { container } = render(() => (
        <Streamdown
          caret="block"
          components={{
            table: (props: JSX.IntrinsicElements["table"]) => (
              <table data-testid="plain-table">{props.children}</table>
            ),
          }}
          isAnimating={true}
        >
          {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
        </Streamdown>
      ));

      expect(
        container.querySelector('[data-testid="plain-table"]')
      ).toBeTruthy();
      expect(isCaretSuppressed(container)).toBe(true);
    });

    it("suppresses the caret under a replaced code component", () => {
      const { container } = render(() => (
        <Streamdown
          caret="block"
          components={{
            code: (props: JSX.IntrinsicElements["code"]) => (
              <code data-testid="plain-code">{props.children}</code>
            ),
          }}
          isAnimating={true}
        >
          {"```javascript\nconst x = 1;"}
        </Streamdown>
      ));

      expect(isCaretSuppressed(container)).toBe(true);
    });
  });

  // The server-markup assertions live in caret-suppression.ssr.test.tsx.
  describe("on the server", () => {
    // plan 7: hydration harness. Server-renders the table document, hydrates
    // it into a container, and checks that hydration reports no mismatch or
    // recoverable error and that the table is still marked caret-suppressed.
    // Task 11's hydration script covers the gate for plan 1.
    it.skip("hydrates without a mismatch when the caret is suppressed", () => {
      // needs server-render-then-hydrate
    });
  });

  it("renders a static document once on mount", () => {
    let renders = 0;
    const P = (props: JSX.IntrinsicElements["p"]) => {
      renders += 1;
      return <p>{props.children}</p>;
    };
    const components = { p: P };

    render(() => (
      <Streamdown components={components} mode="static">
        {"First paragraph.\n\nSecond paragraph."}
      </Streamdown>
    ));

    expect(renders).toBe(2);
  });

  it("keeps the container's className and style constant across block types", () => {
    const chunks = [
      "Some prose to start with.",
      "Some prose to start with.\n\n```javascript\nconst x = 1;",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```\n\n| Name | Age |\n| --- | --- |",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```\n\n| Name | Age |\n| --- | --- |\n| Alice | 30 |",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```\n\n| Name | Age |\n| --- | --- |\n| Alice | 30 |\n\nAnd some more prose.",
    ];

    const [text, setText] = createSignal(chunks[0]);
    const { container } = render(() => (
      <Streamdown caret="block" isAnimating={true}>
        {text()}
      </Streamdown>
    ));

    const wrapper = streamdownContainer(container);
    const className = wrapper?.className;
    const style = wrapper?.getAttribute("style");

    expect(className).toBeTruthy();
    expect(caretVariable(container)).toBe('" ▋"');

    for (const chunk of chunks.slice(1)) {
      setText(chunk);

      const next = streamdownContainer(container);
      expect(next?.className).toBe(className);
      expect(next?.getAttribute("style")).toBe(style);
    }
  });
});
