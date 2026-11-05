/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/email-addresses.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { Show, splitProps } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

// Mock the dependencies
vi.mock("../lib/markdown", () => ({
  Markdown: (props: any) => {
    const [, rest] = splitProps(props, [
      "children",
      "rehypePlugins",
      "remarkPlugins",
      "components",
    ]);
    // Only render if children is provided
    return (
      <Show when={props.children}>
        <div data-testid="markdown" {...rest}>
          {props.children}
        </div>
      </Show>
    );
  },
  defaultUrlTransform: (url: string) => url,
}));

vi.mock("remark-gfm", () => ({
  default: () => {
    // Mock implementation
  },
}));

describe("Email Addresses (#160)", () => {
  it("should render email addresses without blocking them", () => {
    const email = "example@gmail.com";
    const { container } = render(() => (
      <Streamdown parseIncompleteMarkdown={true}>{email}</Streamdown>
    ));

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe(email);
  });

  it("should handle email addresses in sentences", () => {
    const content = "Please contact me at john.doe@example.com for more info";
    const { container } = render(() => (
      <Streamdown parseIncompleteMarkdown={true}>{content}</Streamdown>
    ));

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe(content);
  });

  it("should handle multiple email addresses", () => {
    const content = "Contact admin@site.com or support@site.com";
    const { container } = render(() => (
      <Streamdown parseIncompleteMarkdown={true}>{content}</Streamdown>
    ));

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe(content);
  });

  it("should handle email addresses with special characters", () => {
    const email = "user+test@example-domain.co.uk";
    const { container } = render(() => (
      <Streamdown parseIncompleteMarkdown={true}>{email}</Streamdown>
    ));

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe(email);
  });

  it("should handle email addresses with parseIncompleteMarkdown disabled", () => {
    const email = "example@gmail.com";
    const { container } = render(() => (
      <Streamdown parseIncompleteMarkdown={false}>{email}</Streamdown>
    ));

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe(email);
  });
});
