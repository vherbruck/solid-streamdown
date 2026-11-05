import { code } from "@solid-streamdown/code";
import { render, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Streamdown, type StreamdownProps } from "../index";
import { renderStreamdown } from "./support/render-streamdown";

const SLOW = { timeout: 15_000 };

const rows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-streamdown="code-block-body"] code > span'));
const tokenColors = (row: HTMLElement | undefined) =>
  Array.from(row?.children ?? []).map((token) =>
    (token as HTMLElement).style.getPropertyValue("--sdm-c")
  );
const isHighlighted = (container: HTMLElement) =>
  rows(container).some((row) => tokenColors(row).some((color) => color && color !== "inherit"));

describe("Streamdown with @solid-streamdown/code", () => {
  it("accepts the real plugin where core expects a code highlighter", () => {
    // A compile-time check as much as a runtime one: `code` must satisfy
    // core's structural CodeHighlighterPlugin type.
    const plugins: StreamdownProps["plugins"] = { code };
    expect(plugins?.code?.name).toBe("shiki");
  });

  it("highlights a fenced block into colored tokens", async () => {
    const { container } = render(() => (
      <Streamdown mode="static" plugins={{ code }}>
        {"```ts\nconst answer: number = 42;\n```"}
      </Streamdown>
    ));
    await waitFor(() => expect(isHighlighted(container)).toBe(true), SLOW);
    expect(tokenColors(rows(container)[0]).length).toBeGreaterThan(1);
    expect(rows(container)[0]?.textContent).toBe("const answer: number = 42;");
  });

  it("renders an unsupported language as plain text", async () => {
    const { container } = render(() => (
      <Streamdown mode="static" plugins={{ code }}>
        {"```not-a-language\nplain words\n```"}
      </Streamdown>
    ));
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(rows(container)[0]?.textContent).toBe("plain words");
  });

  it("re-highlights when shikiTheme changes", async () => {
    const view = renderStreamdown({
      children: "```ts\nconst answer = 42;\n```",
      mode: "static",
      plugins: { code },
    });
    await waitFor(() => expect(isHighlighted(view.container)).toBe(true), SLOW);
    const before = tokenColors(rows(view.container)[0]).join(",");

    view.rerender({
      children: "```ts\nconst answer = 42;\n```",
      mode: "static",
      plugins: { code },
      shikiTheme: ["min-light", "min-dark"],
    });

    await waitFor(
      () => expect(tokenColors(rows(view.container)[0]).join(",")).not.toBe(before),
      SLOW
    );
  });

  it("keeps the block and its rows while a fence streams, ending on the latest code", async () => {
    const lines = ["const a = 1;", "const b = a + 1;", "function sum(x: number) {", "  return x + b;", "}"];
    const [text, setText] = createSignal(`\`\`\`ts\n${lines[0]}`);
    const { container } = render(() => (
      <Streamdown isAnimating plugins={{ code }}>
        {text()}
      </Streamdown>
    ));
    const block = container.querySelector('[data-streamdown="code-block"]');
    const firstRow = rows(container)[0];

    for (let i = 2; i <= lines.length; i++) {
      setText(`\`\`\`ts\n${lines.slice(0, i).join("\n")}`);
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    setText(`\`\`\`ts\n${lines.join("\n")}\n\`\`\``);

    expect(container.querySelector('[data-streamdown="code-block"]')).toBe(block);
    expect(rows(container)[0]).toBe(firstRow);
    await waitFor(() => expect(isHighlighted(container)).toBe(true), SLOW);
    // Give any late callbacks for older code a chance to land; none may win.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(rows(container).map((row) => row.textContent)).toEqual(lines);
  });
});
