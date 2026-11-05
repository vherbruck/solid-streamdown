import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkDocs } from "./check-docs.mjs";

const setup = (page, files = {}) => {
  const root = mkdtempSync(join(tmpdir(), "check-docs-"));
  mkdirSync(join(root, "docs", "guide"), { recursive: true });
  writeFileSync(join(root, "docs", "guide", "page.md"), page);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
};

describe("check-docs", () => {
  it("passes a block that equals its example", () => {
    const root = setup("<!-- example: ex/a.tsx -->\n```tsx\nconst a = 1;\n```\n", {
      "ex/a.tsx": "const a = 1;\n",
    });
    expect(checkDocs(root)).toEqual([]);
  });

  it("fails a TSX block without a marker", () => {
    const root = setup("```tsx\nconst a = 1;\n```\n");
    expect(checkDocs(root)[0]).toContain("has no <!-- example");
  });

  it("leaves other languages alone", () => {
    const root = setup("```bash\nnpm i solid-streamdown\n```\n\n```css\n@source x;\n```\n");
    expect(checkDocs(root)).toEqual([]);
  });

  it("fails a block that drifted from its example", () => {
    const root = setup("<!-- example: ex/a.tsx -->\n```tsx\nconst a = 2;\n```\n", {
      "ex/a.tsx": "const a = 1;\n",
    });
    expect(checkDocs(root)[0]).toContain("differs from ex/a.tsx");
  });

  it("compares a region, dedented", () => {
    const root = setup("<!-- example: ex/a.tsx#use -->\n```tsx\nreturn <A />;\n```\n", {
      "ex/a.tsx": "export const X = () => {\n  // #region use\n  return <A />;\n  // #endregion\n};\n",
    });
    expect(checkDocs(root)).toEqual([]);
  });

  it("reports a missing file or region", () => {
    const root = setup("<!-- example: ex/none.tsx -->\n```tsx\nx\n```\n\n<!-- example: ex/a.tsx#nope -->\n```tsx\nx\n```\n", {
      "ex/a.tsx": "x\n",
    });
    const errors = checkDocs(root);
    expect(errors[0]).toContain("not found: ex/none.tsx");
    expect(errors[1]).toContain('region "nope" not found');
  });

  it("writes examples into their blocks with --write", () => {
    const root = setup("Intro\n\n<!-- example: ex/a.tsx -->\n```tsx\nold\n```\n\nAfter\n", {
      "ex/a.tsx": "const a = 1;\nconst b = 2;\n",
    });
    expect(checkDocs(root, { write: true })).toEqual([]);
    expect(readFileSync(join(root, "docs", "guide", "page.md"), "utf8")).toBe(
      "Intro\n\n<!-- example: ex/a.tsx -->\n```tsx\nconst a = 1;\nconst b = 2;\n```\n\nAfter\n"
    );
    expect(checkDocs(root)).toEqual([]);
  });
});
