// Keeps the code in docs/guide in step with the example apps.
//
// A TypeScript or TSX block in a guide page must be preceded by
//   <!-- example: examples/vite/src/snippets/page/name.tsx -->
// or, for one region of a file,
//   <!-- example: examples/vite/src/snippets/page/name.tsx#region-name -->
// and must equal that file (or the lines between `// #region region-name`
// and `// #endregion`, dedented). Other languages stay inline.
//
// Usage: node scripts/check-docs.mjs [--write] [root]
//   --write  copies each example into its block instead of reporting.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const CHECKED_LANGUAGES = new Set(["ts", "tsx", "typescript", "js", "jsx", "javascript"]);
const MARKER = /^<!--\s*example:\s*([^#\s]+)(?:#([\w-]+))?\s*-->$/;
const FENCE = /^(\s*)(`{3,}|~{3,})(\S*)(.*)$/;

const markdownFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return markdownFiles(path);
    }
    return name.endsWith(".md") ? [path] : [];
  });

const dedent = (lines) => {
  const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^\s*/)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(cut));
};

/** The example text a marker names, or an error message. */
export const readExample = (root, path, region) => {
  let source;
  try {
    source = readFileSync(join(root, path), "utf8");
  } catch {
    return { error: `example file not found: ${path}` };
  }
  const lines = source.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  if (!region) {
    return { text: lines.join("\n") };
  }
  const start = lines.findIndex((line) => line.trim() === `// #region ${region}`);
  if (start === -1) {
    return { error: `region "${region}" not found in ${path}` };
  }
  const end = lines.findIndex((line, index) => index > start && line.trim() === "// #endregion");
  if (end === -1) {
    return { error: `region "${region}" in ${path} has no // #endregion` };
  }
  return { text: dedent(lines.slice(start + 1, end)).join("\n") };
};

/** Checks (or, with write, updates) one page. Returns its errors. */
export const checkPage = (root, file, { write = false } = {}) => {
  const lines = readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n");
  const errors = [];
  const output = [];
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(FENCE);
    output.push(lines[i]);
    if (!open) {
      continue;
    }
    const [, indent, fence, language] = open;
    let close = i + 1;
    while (close < lines.length && !lines[close].startsWith(`${indent}${fence}`)) {
      close++;
    }
    const body = lines.slice(i + 1, close);
    const where = `${relative(root, file)}:${i + 1}`;
    if (CHECKED_LANGUAGES.has(language.toLowerCase())) {
      let previous = i - 1;
      while (previous >= 0 && !lines[previous].trim()) {
        previous--;
      }
      const marker = previous >= 0 ? lines[previous].trim().match(MARKER) : null;
      if (!marker) {
        errors.push(`${where}: ${language} block has no <!-- example: … --> marker`);
      } else {
        const example = readExample(root, marker[1], marker[2]);
        if (example.error) {
          errors.push(`${where}: ${example.error}`);
        } else if (body.join("\n") !== example.text) {
          if (write) {
            output.push(...example.text.split("\n"));
            output.push(lines[close] ?? `${indent}${fence}`);
            i = close;
            changed = true;
            continue;
          }
          errors.push(`${where}: block differs from ${marker[1]}${marker[2] ? `#${marker[2]}` : ""}`);
        }
      }
    }
    output.push(...body);
    if (close < lines.length) {
      output.push(lines[close]);
    }
    i = close;
  }
  if (write && changed) {
    writeFileSync(file, output.join("\n"));
  }
  return write ? errors.filter((error) => !error.includes("differs from")) : errors;
};

export const checkDocs = (root, options = {}) =>
  markdownFiles(join(root, "docs", "guide")).flatMap((file) => checkPage(root, file, options));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const root = args.find((arg) => !arg.startsWith("--")) ?? process.cwd();
  const errors = checkDocs(root, { write });
  if (errors.length) {
    console.error(`docs check failed:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
    process.exit(1);
  }
  console.log(write ? "docs synced" : "docs ok");
}
