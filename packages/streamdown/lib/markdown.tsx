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

// Plugin functions are keyed by identity: each gets a stable number, so two
// different plugins that share a name never share a processor.
const identityIds = new WeakMap<object, number>();
let nextIdentityId = 0;

const identityKey = (value: object): string => {
  let id = identityIds.get(value);
  if (id === undefined) {
    nextIdentityId += 1;
    id = nextIdentityId;
    identityIds.set(value, id);
  }
  return `#${id}`;
};

const isPlainObject = (value: object): boolean => {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

class CyclicValueError extends Error {}

// Deterministic serialization with sorted keys. Functions and non-plain
// objects (class instances, RegExp, Map, ...) serialize by identity.
const structuralKey = (value: unknown, ancestors: object[]): string => {
  if (typeof value === "function") {
    return identityKey(value);
  }
  if (typeof value !== "object" || value === null) {
    return `${typeof value}:${String(value)}`;
  }
  if (!(Array.isArray(value) || isPlainObject(value))) {
    return identityKey(value);
  }
  if (ancestors.includes(value)) {
    throw new CyclicValueError();
  }
  ancestors.push(value);
  const key = Array.isArray(value)
    ? `[${value.map((item) => structuralKey(item, ancestors)).join(",")}]`
    : `{${Object.keys(value)
        .sort()
        .map(
          (name) =>
            `${JSON.stringify(name)}:${structuralKey((value as Record<string, unknown>)[name], ancestors)}`
        )
        .join(",")}}`;
  ancestors.pop();
  return key;
};

const optionsKey = (value: unknown): string => {
  try {
    return structuralKey(value, []);
  } catch (error) {
    if (error instanceof CyclicValueError && typeof value === "object") {
      return identityKey(value as object);
    }
    throw error;
  }
};

const pluginKey = (plugin: unknown): string => {
  if (Array.isArray(plugin)) {
    const [attacher, ...rest] = plugin;
    return `${pluginKey(attacher)}:${rest.map(optionsKey).join(":")}`;
  }
  if (typeof plugin === "function" || (typeof plugin === "object" && plugin !== null)) {
    // Presets and attachers are keyed by identity
    return identityKey(plugin);
  }
  return `${typeof plugin}:${String(plugin)}`;
};

const serializePlugins = (plugins: PluggableList | undefined): string =>
  plugins ? plugins.map(pluginKey).join(",") : "";

// The props that decide which processor is built, read once per parse so the
// cache key and the processor are always made from the same values.
type ProcessorConfig = Pick<
  Options,
  "rehypePlugins" | "remarkPlugins" | "remarkRehypeOptions"
>;

const generateCacheKey = ({
  rehypePlugins,
  remarkPlugins,
  remarkRehypeOptions,
}: ProcessorConfig): string => {
  // Fast path for no plugins (most common case)
  if (!(rehypePlugins || remarkPlugins || remarkRehypeOptions)) {
    return "default";
  }
  return `${serializePlugins(remarkPlugins)}::${serializePlugins(rehypePlugins)}::${
    remarkRehypeOptions ? optionsKey(remarkRehypeOptions) : ""
  }`;
};

// LRU Cache for unified processors
class ProcessorCache {
  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  private readonly cache = new Map<string, any>();
  private readonly maxSize = 100;

  get(key: string) {
    const processor = this.cache.get(key);

    if (processor) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, processor);
    }

    return processor;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  set(key: string, processor: any): void {
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
  const config: ProcessorConfig = {
    rehypePlugins: options.rehypePlugins,
    remarkPlugins: options.remarkPlugins,
    remarkRehypeOptions: options.remarkRehypeOptions,
  };
  const key = generateCacheKey(config);

  // Try to get from cache first
  const cached = processorCache.get(key);
  if (cached) {
    return cached;
  }

  // Create new processor and cache it
  const processor = createProcessor(config);
  processorCache.set(key, processor);
  return processor;
};

const hasRehypeRaw = (plugins: PluggableList): boolean =>
  plugins.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === rehypeRaw : plugin === rehypeRaw
  );

const createProcessor = (options: ProcessorConfig) => {
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
