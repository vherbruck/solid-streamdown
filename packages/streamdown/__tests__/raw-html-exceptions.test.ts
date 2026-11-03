/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, it } from "vitest";

// Spec, "Security requirements": nothing may use these APIs on
// content-derived data except the named exceptions below. Plan 5 adds the
// Mermaid SVG insertion and the DOMParser used for diagram downloads.
const RAW_HTML_API = /\b(innerHTML|outerHTML|insertAdjacentHTML|DOMParser|createContextualFragment)\b|\beval\s*\(|\bnew\s+Function\b/g;

const ALLOWED = [
  // Table copy puts the rendered, already-sanitized table on the clipboard as
  // text/html. Nothing is inserted into the page.
  "lib/table/copy-dropdown.tsx: outerHTML",
];

const root = join(import.meta.dirname, "..");

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });

const withoutComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

it("uses raw-HTML APIs only at the named exceptions", () => {
  const found: string[] = [];
  for (const file of [join(root, "index.tsx"), ...sourceFiles(join(root, "lib"))]) {
    const source = withoutComments(readFileSync(file, "utf8"));
    for (const match of source.matchAll(RAW_HTML_API)) {
      found.push(`${relative(root, file)}: ${match[0]}`);
    }
  }
  expect(found.sort()).toEqual([...ALLOWED].sort());
});
