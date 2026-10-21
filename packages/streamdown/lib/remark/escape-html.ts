/**
 * Ported from vercel/streamdown packages/streamdown/lib/remark/escape-html.ts @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */

import type { HTML, Parent, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

// Convert HTML nodes to text when rehype-raw is not present
// This allows HTML to be displayed as escaped text instead of being stripped
export const remarkEscapeHtml: Plugin<[], Root> = () => (tree) => {
  visit(tree, "html", (node: HTML, index: number | undefined, parent?: Parent) => {
    /* v8 ignore next */
    if (!parent || typeof index !== "number") {
      return;
    }

    // Convert HTML node to text node - React will handle escaping
    parent.children[index] = {
      type: "text",
      value: node.value,
    };
  });
};
