import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../src/parser";

describe("parseMarkdown", () => {
  it("returns null for empty content", () => {
    expect(parseMarkdown("")).toBeNull();
  });

  it("parses simple paragraph", () => {
    const result = parseMarkdown("Hello world");
    expect(result).toBeTruthy();
  });

  it("parses heading", () => {
    const result = parseMarkdown("# Title");
    expect(result).toBeTruthy();
  });

  it("parses GFM tables", () => {
    const input = "| A | B |\n| --- | --- |\n| 1 | 2 |";
    const result = parseMarkdown(input);
    expect(result).toBeTruthy();
  });

  it("parses GFM strikethrough", () => {
    const result = parseMarkdown("~~deleted~~");
    expect(result).toBeTruthy();
  });

  it("parses GFM task lists", () => {
    const input = "- [x] Done\n- [ ] Todo";
    const result = parseMarkdown(input);
    expect(result).toBeTruthy();
  });

  it("applies incomplete markdown fix when streaming", () => {
    // This should not throw even with unclosed code fence
    const result = parseMarkdown("```js\nconst x = 1;", {
      isStreaming: true,
    });
    expect(result).toBeTruthy();
  });

  it("handles code blocks in static mode", () => {
    const result = parseMarkdown("```js\nconst x = 1;\n```");
    expect(result).toBeTruthy();
  });
});
