/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/streamdown.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { createSignal, type JSX, Show, splitProps } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";
import type { MermaidConfig } from "../lib/plugin-types";

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

// Upstream also mocks rehype-katex and remark-math, which this package does
// not depend on (plan 6 adds math as a separate package).
vi.mock("remark-gfm", () => ({
  default: () => {
    // Mock implementation
  },
}));

describe("Streamdown Component", () => {
  it("should render markdown content", () => {
    const content = "# Hello World";
    const { container } = render(() => <Streamdown>{content}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should parse incomplete markdown by default", () => {
    const content = "Text with **incomplete bold";
    const { container } = render(() => <Streamdown>{content}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe("Text with **incomplete bold**");
  });

  it("should not parse incomplete markdown when disabled", () => {
    const content = "Text with **incomplete bold";
    const { container } = render(() => (
      <Streamdown parseIncompleteMarkdown={false}>{content}</Streamdown>
    ));
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe("Text with **incomplete bold");
  });

  it("should handle non-string children", () => {
    const content = <div>Solid Element</div>;
    const { container } = render(() => (
      <Streamdown>{content as any}</Streamdown>
    ));
    // Non-string children get converted to empty string, so no blocks are created
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.children.length).toBe(0);
  });

  it("should merge custom components with defaults", () => {
    const customComponents = {
      h1: (props: { children?: JSX.Element }) => (
        <h1 class="custom-h1">{props.children}</h1>
      ),
    };

    const { container } = render(() => (
      <Streamdown components={customComponents}># Heading</Streamdown>
    ));

    // The markdown might not render synchronously, let's check the wrapper exists
    const wrapper = container.querySelector('[data-testid="markdown"]');
    expect(wrapper).toBeTruthy();

    // Check if any h1 exists at all (custom or default)
    const h1 = container.querySelector("h1");
    // If h1 exists, it should have the custom class
    if (h1) {
      expect(h1.className).toContain("custom-h1");
      expect(h1.textContent).toBe("Heading");
    } else {
      // The component renders but heading might be parsed differently
      expect(wrapper?.textContent).toContain("Heading");
    }
  });

  it("should merge custom rehype plugins", () => {
    const customPlugin = () => {
      // Mock plugin implementation
    };

    const { container } = render(() => (
      <Streamdown rehypePlugins={[customPlugin]}>Content</Streamdown>
    ));

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should merge custom remark plugins", () => {
    const customPlugin = () => {
      // Mock plugin implementation
    };

    const { container } = render(() => (
      <Streamdown remarkPlugins={[customPlugin]}>Content</Streamdown>
    ));

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should memoize based on children prop", () => {
    const [className, setClassName] = createSignal("class1");
    const [children, setChildren] = createSignal("Content");
    const { container } = render(() => (
      <Streamdown class={className()}>{children()}</Streamdown>
    ));

    // Same children, different prop
    setClassName("class2");

    // Different children
    setChildren("Different Content");

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe("Different Content");
  });

  it("should handle empty children", () => {
    const { container } = render(() => <Streamdown>{""}</Streamdown>);
    // Empty string results in no blocks
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.children.length).toBe(0);
    expect(wrapper?.textContent).toBe("");
  });

  it("should handle null children", () => {
    const { container } = render(() => (
      <Streamdown>{null as any}</Streamdown>
    ));
    // Null children get converted to empty string, so no blocks are created
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.children.length).toBe(0);
  });

  it("should handle undefined children", () => {
    const { container } = render(() => (
      <Streamdown>{undefined as any}</Streamdown>
    ));
    // Undefined children get converted to empty string, so no blocks are created
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.children.length).toBe(0);
  });

  it("should handle number children", () => {
    const { container } = render(() => <Streamdown>{123 as any}</Streamdown>);
    // Numbers get converted to empty string, so no blocks are created
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.children.length).toBe(0);
    expect(wrapper?.textContent).toBe("");
  });

  it("should handle complex markdown with incomplete tokens", () => {
    const content = `
# Heading
This is **bold** and *italic* text.
Here's an incomplete **bold
And an incomplete [link
`;

    const { container } = render(() => <Streamdown>{content}</Streamdown>);
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    // Check that incomplete markdown is parsed correctly
    // The content is split into blocks and rendered separately
    const allText = wrapper?.textContent || "";
    expect(allText).toContain("Heading");
    expect(allText).toContain("bold");
    expect(allText).toContain("italic");
  });

  it("should accept mermaid config prop", () => {
    const mermaidConfig: MermaidConfig = {
      theme: "dark",
      themeVariables: {
        primaryColor: "#ff0000",
      },
    } as MermaidConfig;

    const { container } = render(() => (
      <Streamdown mermaid={{ config: mermaidConfig }}>Test content</Streamdown>
    ));

    // Just verify it renders without error when mermaid config is provided
    expect(container.firstElementChild).toBeTruthy();
  });

  it("should render without mermaid config", () => {
    const { container } = render(() => <Streamdown>Test content</Streamdown>);

    // Just verify it renders without error when mermaid config is not provided
    expect(container.firstElementChild).toBeTruthy();
  });

  it("should render in static mode without block parsing", () => {
    const content = "# Hello\n\nThis is a paragraph.";
    const { container } = render(() => (
      <Streamdown mode="static">{content}</Streamdown>
    ));

    // In static mode, there should be only one Markdown component rendering all content
    const markdowns = container.querySelectorAll('[data-testid="markdown"]');
    expect(markdowns.length).toBe(1);
    expect(markdowns[0]?.textContent).toContain("Hello");
    expect(markdowns[0]?.textContent).toContain("This is a paragraph.");
  });

  it("should render in streaming mode with block parsing by default", () => {
    const content = "# Hello\n\nThis is a paragraph.";
    const { container } = render(() => <Streamdown>{content}</Streamdown>);

    // In streaming mode, content is split into blocks
    const markdowns = container.querySelectorAll('[data-testid="markdown"]');
    expect(markdowns.length).toBeGreaterThan(1);
  });

  it("should render in streaming mode when explicitly set", () => {
    const content = "# Hello\n\nThis is a paragraph.";
    const { container } = render(() => (
      <Streamdown mode="streaming">{content}</Streamdown>
    ));

    // In streaming mode, content is split into blocks
    const markdowns = container.querySelectorAll('[data-testid="markdown"]');
    expect(markdowns.length).toBeGreaterThan(1);
  });

  it("should not parse incomplete markdown in static mode", () => {
    const content = "Text with **incomplete bold";
    const { container } = render(() => (
      <Streamdown mode="static">{content}</Streamdown>
    ));

    const markdown = container.querySelector('[data-testid="markdown"]');
    // In static mode, incomplete markdown is NOT parsed/fixed
    expect(markdown?.textContent).toBe("Text with **incomplete bold");
  });

  it("should memoize based on mode prop", () => {
    const [mode, setMode] = createSignal<"static" | "streaming">("streaming");
    const { container } = render(() => (
      <Streamdown mode={mode()}>Content</Streamdown>
    ));

    // Different mode - should re-render
    setMode("static");

    // Verify it rendered
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe("Content");
  });
});

describe("animation callbacks", () => {
  it("fires onAnimationStart when isAnimating transitions false → true", () => {
    const onAnimationStart = vi.fn();
    const [animating, setAnimating] = createSignal(false);
    render(() => (
      <Streamdown isAnimating={animating()} onAnimationStart={onAnimationStart}>
        content
      </Streamdown>
    ));
    expect(onAnimationStart).not.toHaveBeenCalled();

    setAnimating(true);
    expect(onAnimationStart).toHaveBeenCalledTimes(1);
  });

  it("fires onAnimationEnd when isAnimating transitions true → false", () => {
    const onAnimationEnd = vi.fn();
    const [animating, setAnimating] = createSignal(true);
    render(() => (
      <Streamdown isAnimating={animating()} onAnimationEnd={onAnimationEnd}>
        content
      </Streamdown>
    ));
    expect(onAnimationEnd).not.toHaveBeenCalled();

    setAnimating(false);
    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });

  it("fires onAnimationStart on initial mount when isAnimating={true}", () => {
    const onAnimationStart = vi.fn();
    render(() => (
      <Streamdown isAnimating={true} onAnimationStart={onAnimationStart}>
        content
      </Streamdown>
    ));
    expect(onAnimationStart).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire onAnimationEnd on initial mount when isAnimating={false}", () => {
    const onAnimationEnd = vi.fn();
    render(() => (
      <Streamdown isAnimating={false} onAnimationEnd={onAnimationEnd}>
        content
      </Streamdown>
    ));
    expect(onAnimationEnd).not.toHaveBeenCalled();
  });

  it("does not fire callbacks when isAnimating is unchanged across re-renders", () => {
    const onAnimationStart = vi.fn();
    const onAnimationEnd = vi.fn();
    const [children, setChildren] = createSignal("content");
    render(() => (
      <Streamdown
        isAnimating={true}
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        {children()}
      </Streamdown>
    ));
    onAnimationStart.mockClear();

    setChildren("updated content");
    expect(onAnimationStart).not.toHaveBeenCalled();
    expect(onAnimationEnd).not.toHaveBeenCalled();
  });

  it("fires callbacks correctly across multiple animation cycles", () => {
    const onAnimationStart = vi.fn();
    const onAnimationEnd = vi.fn();
    const [animating, setAnimating] = createSignal(false);
    render(() => (
      <Streamdown
        isAnimating={animating()}
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    ));

    setAnimating(true);
    setAnimating(false);
    setAnimating(true);
    setAnimating(false);

    expect(onAnimationStart).toHaveBeenCalledTimes(2);
    expect(onAnimationEnd).toHaveBeenCalledTimes(2);
  });

  it("does not throw when callbacks are not provided and isAnimating toggles", () => {
    const [animating, setAnimating] = createSignal(false);
    render(() => <Streamdown isAnimating={animating()}>content</Streamdown>);
    expect(() => {
      setAnimating(true);
      setAnimating(false);
    }).not.toThrow();
  });

  it('suppresses callbacks in mode="static"', () => {
    const onAnimationStart = vi.fn();
    const onAnimationEnd = vi.fn();
    const [animating, setAnimating] = createSignal(false);
    render(() => (
      <Streamdown
        isAnimating={animating()}
        mode="static"
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    ));

    setAnimating(true);
    setAnimating(false);

    expect(onAnimationStart).not.toHaveBeenCalled();
    expect(onAnimationEnd).not.toHaveBeenCalled();
  });

  it("fires animation callbacks on isAnimating transitions only", () => {
    const start = vi.fn();
    const end = vi.fn();
    const [on, setOn] = createSignal(true);
    render(() => (
      <Streamdown
        isAnimating={on()}
        onAnimationEnd={end}
        onAnimationStart={start}
      >
        {"x"}
      </Streamdown>
    ));
    expect(start).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
    setOn(false);
    expect(end).toHaveBeenCalledTimes(1);
    setOn(true);
    expect(start).toHaveBeenCalledTimes(2);
  });
});

describe("animation callbacks", () => {
  it("does not track signals the callbacks read", () => {
    const [count, setCount] = createSignal(0);
    const [isAnimating, setIsAnimating] = createSignal(false);
    let starts = 0;
    let effectRuns = 0;
    render(() => (
      <Streamdown
        isAnimating={isAnimating()}
        onAnimationStart={() => {
          starts += 1;
          count();
        }}
        onAnimationEnd={() => {
          effectRuns += 1;
          count();
        }}
      >
        {"x"}
      </Streamdown>
    ));
    setIsAnimating(true);
    expect(starts).toBe(1);
    setCount(1);
    setIsAnimating(false);
    expect(effectRuns).toBe(1);
    setCount(2);
    expect(starts).toBe(1);
    expect(effectRuns).toBe(1);
  });
});
