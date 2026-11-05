import type { BundledLanguage } from "shiki";
import { describe, expect, it, vi } from "vitest";
import { createCodePlugin, type HighlightResult } from "../index";

// Lets a test make the next highlighter load fail, as a chunk-load or
// network error would.
let failNextLoad = false;

vi.mock("shiki", async (importOriginal) => {
  const shiki = await importOriginal<typeof import("shiki")>();
  return {
    ...shiki,
    createHighlighter: async (...args: Parameters<typeof shiki.createHighlighter>) => {
      if (failNextLoad) {
        failNextLoad = false;
        throw new Error("load failed");
      }
      return shiki.createHighlighter(...args);
    },
  };
});

describe("highlighter loading", () => {
  it("retries a load that failed instead of caching the failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const plugin = createCodePlugin({ themes: ["github-light", "github-dark"] });
    const request = (code: string) => ({
      code,
      isIncomplete: false,
      language: "rust" as BundledLanguage,
      themes: ["github-light", "github-dark"] as ["github-light", "github-dark"],
    });

    failNextLoad = true;
    const first = vi.fn();
    plugin.highlight(request("fn a() {}"), first);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(first).not.toHaveBeenCalled();

    const second = await new Promise<HighlightResult>((resolve) => {
      const cached = plugin.highlight(request("fn b() {}"), resolve);
      if (cached) {
        resolve(cached);
      }
    });
    expect(second.tokens.length).toBeGreaterThan(0);
  });
});
