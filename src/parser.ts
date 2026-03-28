import type { JSX } from "solid-js";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { jsx, jsxs, Fragment } from "solid-js/h/jsx-runtime";
import type { ComponentOverrides } from "./types";
import { parseIncompleteMarkdown } from "./utils/parse-incomplete-markdown";

interface ParseOptions {
  components?: ComponentOverrides;
  /** Whether content is streaming (applies incomplete markdown fixes) */
  isStreaming?: boolean;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false });

export function parseMarkdown(
  content: string,
  options?: ParseOptions,
): JSX.Element {
  if (!content) return null;

  // Fix unterminated syntax when streaming
  const prepared = options?.isStreaming
    ? parseIncompleteMarkdown(content)
    : content;

  const mdast = processor.runSync(processor.parse(prepared));

  return toJsxRuntime(mdast as Parameters<typeof toJsxRuntime>[0], {
    jsx: jsx as any,
    jsxs: jsxs as any,
    Fragment,
    components: options?.components as any,
  }) as JSX.Element;
}
