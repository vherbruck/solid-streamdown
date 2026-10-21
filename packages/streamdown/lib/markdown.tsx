/**
 * Ported from vercel/streamdown packages/streamdown/lib/markdown.ts (renamed .tsx) @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import type { Element, Nodes, Parents, Root } from "hast";
import { urlAttributes } from "html-url-attributes";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import remarkRehype from "remark-rehype";
import type { Component, JSX } from "solid-js";
import type { PluggableList } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { createHastTree, HastNodes, RenderContext } from "./hast-render";
import { remarkEscapeHtml } from "./remark/escape-html";

export interface ExtraProps {
  node?: Element | undefined;
}

export type AllowElement = (
  element: Readonly<Element>,
  index: number,
  parent: Readonly<Parents> | undefined
) => boolean | null | undefined;

export type UrlTransform = (
  url: string,
  key: string,
  node: Readonly<Element>
) => string | null | undefined;

export type Components = {
  [Key in keyof JSX.IntrinsicElements]?:
    | Component<JSX.IntrinsicElements[Key] & ExtraProps>
    | keyof JSX.IntrinsicElements;
} & {
  inlineCode?: Component<JSX.IntrinsicElements["code"] & ExtraProps>;
  // biome-ignore lint/suspicious/noExplicitAny: custom tags receive arbitrary props
  [key: string]: Component<any> | keyof JSX.IntrinsicElements | undefined;
};

export interface Options {
  allowElement?: AllowElement;
  allowedElements?: readonly string[];
  children?: string;
  components?: Components;
  disallowedElements?: readonly string[];
  rehypePlugins?: PluggableList;
  remarkPlugins?: PluggableList;
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions>;
  skipHtml?: boolean;
  unwrapDisallowed?: boolean;
  urlTransform?: UrlTransform;
}

// Stable references for common cases
const EMPTY_PLUGINS: PluggableList = [];
const DEFAULT_REMARK_REHYPE_OPTIONS = { allowDangerousHtml: true };

// Identity keys: each function or object gets a stable number, so two
// different plugins that share a name never share a processor.
const identityIds = new WeakMap<object, number>();
let nextIdentityId = 0;

const identityKey = (value: unknown): string => {
  if (
    (typeof value === "object" && value !== null) ||
    typeof value === "function"
  ) {
    let id = identityIds.get(value);
    if (id === undefined) {
      nextIdentityId += 1;
      id = nextIdentityId;
      identityIds.set(value, id);
    }
    return `#${id}`;
  }
  // Primitives (and undefined, which JSON.stringify skips) serialize by value
  return `${typeof value}:${String(value)}`;
};

const serializePlugins = (plugins: PluggableList | undefined): string => {
  if (!plugins || plugins.length === 0) {
    return "";
  }
  return plugins
    .map((plugin) =>
      Array.isArray(plugin)
        ? `${identityKey(plugin[0])}:${plugin
            .slice(1)
            .map(identityKey)
            .join(":")}`
        : identityKey(plugin)
    )
    .join(",");
};

const generateCacheKey = (options: Readonly<Options>): string => {
  const { rehypePlugins, remarkPlugins, remarkRehypeOptions } = options;

  // Fast path for no plugins (most common case)
  if (!(rehypePlugins || remarkPlugins || remarkRehypeOptions)) {
    return "default";
  }

  const optionsKey = remarkRehypeOptions
    ? identityKey(remarkRehypeOptions)
    : "";
  return `${serializePlugins(remarkPlugins)}::${serializePlugins(rehypePlugins)}::${optionsKey}`;
};

// LRU Cache for unified processors
class ProcessorCache {
  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  private readonly cache = new Map<string, any>();
  private readonly maxSize = 100;

  get(options: Readonly<Options>) {
    const key = generateCacheKey(options);
    const processor = this.cache.get(key);

    if (processor) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, processor);
    }

    return processor;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  set(options: Readonly<Options>, processor: any): void {
    const key = generateCacheKey(options);

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, processor);
  }
}

// Global processor cache instance
const processorCache = new ProcessorCache();

const getCachedProcessor = (options: Readonly<Options>) => {
  // Try to get from cache first
  const cached = processorCache.get(options);
  if (cached) {
    return cached;
  }

  // Create new processor and cache it
  const processor = createProcessor(options);
  processorCache.set(options, processor);
  return processor;
};

const hasRehypeRaw = (plugins: PluggableList): boolean =>
  plugins.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === rehypeRaw : plugin === rehypeRaw
  );

const createProcessor = (options: Readonly<Options>) => {
  const rehypePlugins = options.rehypePlugins || EMPTY_PLUGINS;
  const remarkPlugins = options.remarkPlugins || EMPTY_PLUGINS;

  // When rehype-raw is NOT present, escape HTML to display it as text
  // When rehype-raw IS present, HTML is processed normally
  const finalRemarkPlugins = hasRehypeRaw(rehypePlugins)
    ? remarkPlugins
    : [...remarkPlugins, remarkEscapeHtml];

  const remarkRehypeOptions = options.remarkRehypeOptions
    ? { ...DEFAULT_REMARK_REHYPE_OPTIONS, ...options.remarkRehypeOptions }
    : DEFAULT_REMARK_REHYPE_OPTIONS;

  return unified()
    .use(remarkParse)
    .use(finalRemarkPlugins)
    .use(remarkRehype, remarkRehypeOptions)
    .use(rehypePlugins);
};

export const defaultUrlTransform: UrlTransform = (value) => value;

const handleRawNode = (
  parent: Parents,
  index: number,
  skipHtml: boolean | undefined,
  value: string
): void => {
  if (skipHtml) {
    parent.children.splice(index, 1);
  } else {
    parent.children[index] = { type: "text", value } as never;
  }
};

const transformUrls = (node: Element, transform: UrlTransform): void => {
  for (const key in urlAttributes) {
    if (
      Object.hasOwn(urlAttributes, key) &&
      Object.hasOwn(node.properties, key)
    ) {
      const value = node.properties[key];
      const test = urlAttributes[key];
      if (test === null || test.includes(node.tagName)) {
        node.properties[key] =
          transform(String(value || ""), key, node) ?? undefined;
      }
    }
  }
};

const shouldRemoveElement = (
  node: Readonly<Element>,
  index: number | undefined,
  parent: Readonly<Parents> | undefined,
  allowedElements: readonly string[] | undefined,
  disallowedElements: readonly string[] | undefined,
  allowElement: AllowElement | undefined
): boolean => {
  let remove = false;

  if (allowedElements) {
    remove = !allowedElements.includes(node.tagName);
  } else if (disallowedElements) {
    remove = disallowedElements.includes(node.tagName);
  }

  if (!remove && allowElement && typeof index === "number") {
    remove = !allowElement(node, index, parent);
  }

  return remove;
};

const post = (tree: Nodes, options: Readonly<Options>): Root => {
  const {
    allowElement,
    allowedElements,
    disallowedElements,
    skipHtml,
    unwrapDisallowed,
    urlTransform,
  } = options;

  const hasFiltering =
    allowElement ||
    allowedElements ||
    disallowedElements ||
    skipHtml ||
    urlTransform;

  if (hasFiltering) {
    const transform = urlTransform || defaultUrlTransform;

    visit(tree as Root, (node, index, parent) => {
      if (node.type === "raw" && parent && typeof index === "number") {
        handleRawNode(parent, index, skipHtml, node.value);
        return index;
      }

      if (node.type === "element") {
        transformUrls(node, transform);

        const remove = shouldRemoveElement(
          node,
          index,
          parent,
          allowedElements,
          disallowedElements,
          allowElement
        );

        if (remove && parent && typeof index === "number") {
          if (unwrapDisallowed && node.children) {
            parent.children.splice(index, 1, ...node.children);
          } else {
            parent.children.splice(index, 1);
          }
          return index;
        }
      }
    });
  }

  return tree as Root;
};

/**
 * Parses Markdown into a filtered HAST tree. Always returns a fresh tree,
 * because the reactive renderer adopts and mutates the trees it receives.
 */
export const parseMarkdownToHast = (options: Readonly<Options>): Root => {
  const processor = getCachedProcessor(options);
  const content = options.children || "";
  // biome-ignore lint/suspicious/noExplicitAny: runSync return type varies with processor configuration
  const tree = processor.runSync(processor.parse(content), content) as any;
  return post(tree, options);
};

export const Markdown: Component<Options> = (props) => {
  const tree = createHastTree(() => parseMarkdownToHast(props));
  return (
    <RenderContext.Provider value={() => props.components ?? {}}>
      <HastNodes nodes={tree.children} />
    </RenderContext.Provider>
  );
};
