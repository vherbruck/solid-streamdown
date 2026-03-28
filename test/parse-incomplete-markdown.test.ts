import { describe, it, expect } from "vitest";
import {
  IncompleteMarkdownParser,
  parseIncompleteMarkdown,
} from "../src/utils/parse-incomplete-markdown";

describe("parseIncompleteMarkdown", () => {
  describe("code fences", () => {
    it("closes unclosed code fence", () => {
      const input = "```javascript\nconst x = 1;";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("```javascript\nconst x = 1;\n```");
    });

    it("leaves closed code fence alone", () => {
      const input = "```javascript\nconst x = 1;\n```";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe(input);
    });
  });

  describe("bold", () => {
    it("closes unclosed bold", () => {
      const result = parseIncompleteMarkdown("Hello **world");
      expect(result).toContain("**");
      // Should have an even number of ** markers
      const matches = result.match(/\*\*/g) || [];
      expect(matches.length % 2).toBe(0);
    });

    it("leaves closed bold alone", () => {
      const input = "Hello **world**";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe(input);
    });
  });

  describe("italic", () => {
    it("closes unclosed asterisk italic", () => {
      const result = parseIncompleteMarkdown("Hello *world");
      expect(result).toContain("*");
    });

    it("leaves closed italic alone", () => {
      const input = "Hello *world*";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe(input);
    });
  });

  describe("strikethrough", () => {
    it("closes unclosed strikethrough", () => {
      const result = parseIncompleteMarkdown("Hello ~~world");
      expect(result).toContain("~~");
      const matches = result.match(/~~/g) || [];
      expect(matches.length % 2).toBe(0);
    });
  });

  describe("inline code", () => {
    it("closes unclosed inline code", () => {
      const result = parseIncompleteMarkdown("Hello `code");
      expect(result).toContain("`");
      // Count backticks that aren't part of triple backticks
      const singleBackticks = result
        .split("")
        .filter(
          (c, i) =>
            c === "`" &&
            result.substring(i, i + 3) !== "```" &&
            (i === 0 || result.substring(i - 1, i + 2) !== "```"),
        ).length;
      expect(singleBackticks % 2).toBe(0);
    });
  });

  describe("links", () => {
    it("completes incomplete link with URL", () => {
      const result = parseIncompleteMarkdown("[text](http://exam");
      expect(result).toContain(")");
    });

    it("completes incomplete link without URL", () => {
      const result = parseIncompleteMarkdown("[text");
      expect(result).toContain("]");
    });

    it("leaves complete link alone", () => {
      const input = "[text](https://example.com)";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe(input);
    });
  });

  describe("does not modify content inside code blocks", () => {
    it("ignores bold inside code fence", () => {
      const input = "```\n**not bold\n```";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe(input);
    });
  });

  describe("IncompleteMarkdownParser class", () => {
    it("can be instantiated with custom plugins", () => {
      const parser = new IncompleteMarkdownParser([
        {
          name: "test",
          pattern: /foo/,
          handler: ({ line }) => line.replace("foo", "bar"),
        },
      ]);
      expect(parser.parse("foo")).toBe("bar");
    });

    it("returns empty string for empty input", () => {
      const parser = new IncompleteMarkdownParser();
      expect(parser.parse("")).toBe("");
    });
  });
});
