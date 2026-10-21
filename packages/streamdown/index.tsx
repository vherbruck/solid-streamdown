/**
 * Ported from vercel/streamdown packages/streamdown/index.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { harden } from "rehype-harden";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remend, { type RemendOptions } from "remend";
import {
  type Component,
  createEffect,
  createMemo,
  Index,
  type JSX,
  mergeProps,
  Show,
  splitProps,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Pluggable, PluggableList } from "unified";
import { BlockIncompleteContext } from "./lib/block-incomplete-context";
import { components as builtinComponents } from "./lib/components";
import { MappedElement, resolveTarget } from "./lib/hast-render";
import { detectTextDirection } from "./lib/detect-direction";
import { hasIncompleteCodeFence, hasTable } from "./lib/incomplete-code-utils";
import {
  type Components,
  type ExtraProps,
  Markdown,
  type Options,
} from "./lib/markdown";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import { PluginContext } from "./lib/plugin-context";
import type { PluginConfig, ThemeInput } from "./lib/plugin-types";
import { PrefixContext } from "./lib/prefix-context";
import { preprocessCustomTags } from "./lib/preprocess-custom-tags";
import { preprocessLiteralTagContent } from "./lib/preprocess-literal-tag-content";
import { rehypeBlockDirection } from "./lib/rehype/block-direction";
import { rehypeLiteralTagContent } from "./lib/rehype/literal-tag-content";
import { remarkCodeMeta } from "./lib/remark/code-meta";
import { remarkDisableAutolinkProtocols } from "./lib/remark/disable-autolink-protocols";
import {
  type AllowedTags,
  type ControlsConfig,
  defaultStreamdownContext,
  type LinkSafetyConfig,
  type MermaidOptions,
  type PortalTarget,
  StreamdownContext,
  type StreamdownContextType,
} from "./lib/streamdown-context";
import { createCaretHost } from "./lib/use-caret-host";
import {
  defaultTranslations,
  type StreamdownTranslations,
  TranslationsContext,
} from "./lib/translations-context";
import { type CnFunction, createCn } from "./lib/utils";

export { useIsCodeFenceIncomplete } from "./lib/block-incomplete-context";
export type {
  MarkdownStream,
  MarkdownStreamOptions,
} from "./lib/create-markdown-stream";
export { createMarkdownStream } from "./lib/create-markdown-stream";
export { detectTextDirection } from "./lib/detect-direction";
export type {
  AllowElement,
  Components,
  ExtraProps,
  Options,
  UrlTransform,
} from "./lib/markdown";
export { defaultUrlTransform } from "./lib/markdown";
export { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
export type {
  BundledLanguage,
  BundledTheme,
  CjkPlugin,
  CodeHighlighterPlugin,
  CustomRenderer,
  CustomRendererProps,
  DiagramPlugin,
  HighlightOptions,
  HighlightResult,
  HighlightToken,
  MathPlugin,
  PluginConfig,
  ThemeInput,
  ThemeRegistrationAny,
} from "./lib/plugin-types";
export type {
  AllowedTags,
  ControlsConfig,
  CopyControlConfig,
  CSVSeparator,
  DownloadControlConfig,
  LinkSafetyConfig,
  LinkSafetyModalProps,
  MermaidErrorComponentProps,
  MermaidOptions,
  PortalTarget,
  StreamdownContextType,
} from "./lib/streamdown-context";
export { StreamdownContext } from "./lib/streamdown-context";
export type { StreamdownTranslations } from "./lib/translations-context";
export { defaultTranslations } from "./lib/translations-context";

/**
 * Element component typed against the real intrinsic props + `ExtraProps`.
 * Avoids `Components[K]`, whose string index signature collapses props into a
 * useless intersection (e.g. HTMLHeadingElement & SVGSymbolElement).
 */
type DefaultElementComponent<K extends keyof JSX.IntrinsicElements> =
  Component<JSX.IntrinsicElements[K] & ExtraProps>;

/**
 * Built-in Streamdown components with known keys required.
 * Prefer composing these inside custom `components` overrides instead of
 * re-applying default styles by hand.
 */
// plan 2: a, img and table join this map with their components
export interface DefaultComponents {
  blockquote: DefaultElementComponent<"blockquote">;
  code: DefaultElementComponent<"code">;
  h1: DefaultElementComponent<"h1">;
  h2: DefaultElementComponent<"h2">;
  h3: DefaultElementComponent<"h3">;
  h4: DefaultElementComponent<"h4">;
  h5: DefaultElementComponent<"h5">;
  h6: DefaultElementComponent<"h6">;
  hr: DefaultElementComponent<"hr">;
  li: DefaultElementComponent<"li">;
  ol: DefaultElementComponent<"ol">;
  p: DefaultElementComponent<"p">;
  pre: DefaultElementComponent<"pre">;
  section: DefaultElementComponent<"section">;
  strong: DefaultElementComponent<"strong">;
  sub: DefaultElementComponent<"sub">;
  sup: DefaultElementComponent<"sup">;
  tbody: DefaultElementComponent<"tbody">;
  td: DefaultElementComponent<"td">;
  th: DefaultElementComponent<"th">;
  thead: DefaultElementComponent<"thead">;
  tr: DefaultElementComponent<"tr">;
  ul: DefaultElementComponent<"ul">;
}

export const defaultComponents = builtinComponents as DefaultComponents;

// Matches lowercase HTML / custom tag names (first char is a-z)
const LOWERCASE_TAG_PATTERN = /^[a-z]/;

// Patterns for HTML indentation normalization
// Matches if content starts with an HTML tag (possibly with leading whitespace)
const HTML_BLOCK_START_PATTERN = /^[ \t]*<[\w!/?-]/;
// Matches 4+ spaces/tabs before HTML tags at line starts
const HTML_LINE_INDENT_PATTERN = /(^|\n)[ \t]{4,}(?=<[\w!/?-])/g;

/**
 * Normalizes indentation in HTML blocks to prevent Markdown parsers from
 * treating indented HTML tags as code blocks (4+ spaces = code in Markdown).
 *
 * Useful when rendering AI-generated HTML content with nested tags that
 * are indented for readability.
 *
 * @param content - The raw HTML/Markdown string to normalize
 * @returns The normalized string with reduced indentation before HTML tags
 */
export const normalizeHtmlIndentation = (content: string): string => {
  if (typeof content !== "string" || content.length === 0) {
    return content;
  }
  // Only process if content starts with an HTML-like tag (possibly indented)
  if (!HTML_BLOCK_START_PATTERN.test(content)) {
    return content;
  }
  // Remove 4+ spaces/tabs before HTML tags at line starts
  return content.replace(HTML_LINE_INDENT_PATTERN, "$1");
};

// plan 3: moves to lib/animate.ts together with the animate plugin
export interface AnimateOptions {
  animation?: "fadeIn" | "blurIn" | "slideUp" | (string & {});
  duration?: number;
  easing?: string;
  /**
   * Soft cap (ms) on how far ahead of wall-clock words may be scheduled.
   * Larger values favour longer cascades / stricter cross-block serialization;
   * smaller values keep a fast stream visually caught up. @default 320
   */
  maxBacklogMs?: number;
  sep?: "word" | "char";
  stagger?: number;
}

const carets = {
  block: " ▋",
  circle: " ●",
};

export type StreamdownProps = Options & {
  mode?: "static" | "streaming";
  /**
   * Text direction. `"ltr"` / `"rtl"` force a single direction.
   * `"auto"` detects direction per block: in streaming mode via parsed
   * markdown blocks, in static mode via a rehype pass on each semantic
   * block (headings, paragraphs, list items, table cells, etc.).
   * Detection uses a content-majority strong-character count with
   * first-strong as the tie-breaker; fenced/inline code is excluded from
   * the evidence and code blocks are always rendered LTR.
   */
  dir?: "auto" | "ltr" | "rtl";
  BlockComponent?: Component<BlockProps>;
  parseMarkdownIntoBlocksFn?: (markdown: string) => string[];
  parseIncompleteMarkdown?: boolean;
  /** Normalize HTML block indentation to prevent 4+ spaces being treated as code blocks. @default false */
  normalizeHtmlIndentation?: boolean;
  class?: string;
  shikiTheme?: [ThemeInput, ThemeInput];
  mermaid?: MermaidOptions;
  /**
   * Max height for fenced code blocks. Numbers are treated as px.
   * Set to `0` or `Infinity` to disable. @default 400
   */
  codeBlockMaxHeight?: number | string;
  controls?: ControlsConfig;
  isAnimating?: boolean;
  /**
   * Max height for tables. Numbers are treated as px.
   * Set to `0` or `Infinity` to disable. @default 300
   */
  tableMaxHeight?: number | string;
  animated?: boolean | AnimateOptions;
  caret?: keyof typeof carets;
  plugins?: PluginConfig;
  remend?: RemendOptions;
  linkSafety?: LinkSafetyConfig;
  /**
   * DOM node for Streamdown overlays, or a function returning one.
   * Defaults to `document.body`.
   */
  portal?: PortalTarget;
  /** Custom tags to allow through sanitization with their permitted attributes */
  allowedTags?: AllowedTags;
  /**
   * Fallback component for HTML tags or `allowedTags` entries that have no
   * matching key in the `components` map. Built-in and explicit `components`
   * entries always win — this does not replace the default Tailwind renderers.
   *
   * When set, it applies to:
   * - Custom tags declared via `allowedTags` that have no matching key in
   *   `components`.
   * - Standard HTML tags absent from both the built-in map and `components`
   *   (e.g. `<span>`, `<em>`, `<div>`, `<br>`).
   *
   * @example
   * ```tsx
   * // Render missing map entries / allowedTags via a pass-through
   * <Streamdown
   *   allowedTags={{ mention: ["user_id"] }}
   *   fallbackComponent={(props) => (
   *     <Dynamic component={props.node!.tagName}>{props.children}</Dynamic>
   *   )}
   * >
   *   {markdown}
   * </Streamdown>
   * ```
   */
  fallbackComponent?: Component<Record<string, unknown> & ExtraProps>;
  /**
   * Tags whose children should be treated as plain text (no markdown parsing).
   * Useful for mention/entity tags in AI UIs where child content is a data
   * label rather than prose. Requires the tag to also be listed in `allowedTags`.
   *
   * @example
   * ```tsx
   * <Streamdown
   *   allowedTags={{ mention: ['user_id'] }}
   *   literalTagContent={['mention']}
   * >
   *   {`<mention user_id="123">@_some_username_</mention>`}
   * </Streamdown>
   * ```
   */
  literalTagContent?: string[];
  /**
   * Disable GFM / CommonMark autolinking for specific URL protocols (e.g. bare
   * email addresses become `mailto:` autolinks). Accepts protocol names with
   * or without a trailing colon, case-insensitive (`"mailto"` and `"mailto:"`
   * are equivalent). Only affects autolinks (bare URLs/emails and `<...>`
   * forms) — explicit markdown links (`[text](url)`), including cases where
   * the label reconstructs the URL, are left as links.
   *
   * @example
   * ```tsx
   * <Streamdown disableAutolinkProtocols={["mailto"]}>
   *   {"Contact us at hello@example.com"}
   * </Streamdown>
   * ```
   */
  disableAutolinkProtocols?: string[];
  /** Override UI strings for i18n / custom labels */
  translations?: Partial<StreamdownTranslations>;
  // plan 2: `icons?: Partial<IconMap>` arrives with the icon context
  /** Tailwind CSS prefix to prepend to all utility classes (e.g. `"tw"` produces `tw:flex` instead of `flex`). Enables Tailwind v4's `prefix()` support. Note: user-supplied `class` values are also prefixed. */
  prefix?: string;
  /** Show line numbers in code blocks. @default true */
  lineNumbers?: boolean;
  /**
   * Code fence languages rendered verbatim as plain monospace text, without
   * syntax highlighting, line numbers or controls. Useful for ASCII / Unicode
   * box-drawing diagrams where column alignment matters.
   * Custom renderers and the Mermaid plugin take precedence for matching languages.
   * @default []
   */
  codeBlockRawLanguages?: string[];
  /** Called when isAnimating transitions from false to true. Suppressed in mode="static". */
  onAnimationStart?: () => void;
  /** Called when isAnimating transitions from true to false. Suppressed in mode="static". */
  onAnimationEnd?: () => void;
  /** `data-*` attributes, like `aria-*` attributes, are set on the root element. */
  [dataAttribute: `data-${string}`]:
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined;
} & JSX.AriaAttributes;

const defaultSanitizeSchema = {
  ...defaultSchema,
  // remark-rehype already prefixes footnote ids and backref hrefs with
  // `user-content-` (its default `clobberPrefix`). hast-util-sanitize's default
  // `clobberPrefix` is also `user-content-`, which would double-prefix ids like
  // `user-content-user-content-fn-1` while leaving the (already-prefixed) href
  // pointing at the un-doubled anchor. Disable it here to avoid the mismatch.
  clobberPrefix: "",
  protocols: {
    ...defaultSchema.protocols,
    // `streamdown:` is the remend sentinel scheme for incomplete links/images
    // during streaming (streamdown:incomplete-link / incomplete-image).
    href: [...(defaultSchema.protocols?.href ?? []), "tel", "streamdown"],
    src: [...(defaultSchema.protocols?.src ?? []), "streamdown"],
  },
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "metastring"],
  },
};

export const defaultRehypePlugins: Record<string, Pluggable> = {
  raw: rehypeRaw,
  sanitize: [rehypeSanitize, defaultSanitizeSchema],
  harden: [
    harden,
    {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: ["*"],
      allowedProtocols: ["*"],
      defaultOrigin: undefined,
      allowDataImages: true,
    },
  ],
} as const;

export const defaultRemarkPlugins: Record<string, Pluggable> = {
  gfm: [remarkGfm, {}],
  codeMeta: remarkCodeMeta,
} as const;

// Stable plugin arrays for cache efficiency - created once at module level
const defaultRehypePluginsArray = Object.values(defaultRehypePlugins);
const defaultRemarkPluginsArray = Object.values(defaultRemarkPlugins);

export type BlockProps = Options & {
  content: string;
  shouldParseIncompleteMarkdown: boolean;
  shouldNormalizeHtmlIndentation: boolean;
  index: number;
  /** Whether this block is incomplete (still being streamed) */
  isIncomplete: boolean;
  /** Resolved text direction for this block */
  dir?: "ltr" | "rtl";
};

export const Block: Component<BlockProps> = (props) => {
  // Split off the internal props so they don't reach Markdown
  const [local, rest] = splitProps(props, [
    "content",
    "shouldParseIncompleteMarkdown",
    "shouldNormalizeHtmlIndentation",
    "index",
    "isIncomplete",
    "dir",
  ]);

  // Note: remend is already applied to the entire markdown before parsing into blocks
  // in the Streamdown component, so we don't need to apply it again here
  const normalizedContent = () =>
    typeof local.content === "string" && local.shouldNormalizeHtmlIndentation
      ? normalizeHtmlIndentation(local.content)
      : local.content;

  const inner = () => <Markdown {...rest}>{normalizedContent()}</Markdown>;

  return (
    <BlockIncompleteContext.Provider value={() => local.isIncomplete}>
      <Show when={local.dir} fallback={inner()}>
        {(dir) => (
          <div dir={dir()} style={{ display: "contents" }}>
            {inner()}
          </div>
        )}
      </Show>
    </BlockIncompleteContext.Provider>
  );
};

const ROOT_CLASSES =
  // Use [&>*] arbitrary variant syntax for Tailwind v3 + v4 compat (v3 lacks the *: variant)
  "space-y-4 whitespace-normal [&>*:first-child]:mt-0 [&>*:last-child]:mb-0";

const CARET_CLASSES =
  "[&>*:last-child:not([data-sd-caret-hidden])]:after:inline [&>*:last-child:not([data-sd-caret-hidden])]:after:align-baseline [&>*:last-child:not([data-sd-caret-hidden])]:after:content-[var(--streamdown-caret)]";

const STREAMDOWN_DEFAULTS = {
  mode: "streaming",
  parseIncompleteMarkdown: true,
  normalizeHtmlIndentation: false,
  rehypePlugins: defaultRehypePluginsArray,
  remarkPlugins: defaultRemarkPluginsArray,
  codeBlockMaxHeight: 400,
  controls: true,
  isAnimating: false,
  tableMaxHeight: 300,
  BlockComponent: Block,
  parseMarkdownIntoBlocksFn: parseMarkdownIntoBlocks,
  linkSafety: defaultStreamdownContext.linkSafety,
  lineNumbers: true,
} satisfies Partial<StreamdownProps>;

// Props that Streamdown consumes itself. The rest (Options and the
// data-*/aria-* attributes) pass through to Markdown, as upstream.
const STREAMDOWN_PROP_NAMES = [
  "children",
  "mode",
  "dir",
  "parseIncompleteMarkdown",
  "normalizeHtmlIndentation",
  "components",
  "rehypePlugins",
  "remarkPlugins",
  "class",
  "shikiTheme",
  "mermaid",
  "codeBlockMaxHeight",
  "controls",
  "isAnimating",
  "tableMaxHeight",
  "animated",
  "BlockComponent",
  "parseMarkdownIntoBlocksFn",
  "caret",
  "plugins",
  "remend",
  "linkSafety",
  "portal",
  "lineNumbers",
  "codeBlockRawLanguages",
  "allowedTags",
  "fallbackComponent",
  "literalTagContent",
  "disableAutolinkProtocols",
  "translations",
  "prefix",
  "onAnimationStart",
  "onAnimationEnd",
] as const satisfies readonly (keyof StreamdownProps)[];

type CodeProps = JSX.IntrinsicElements["code"] & ExtraProps;

export const Streamdown: Component<StreamdownProps> = (rawProps) => {
  const props = mergeProps(STREAMDOWN_DEFAULTS, rawProps);
  const [, rest] = splitProps(props, STREAMDOWN_PROP_NAMES);

  // TypeScript accepts any `data-*` or `aria-*` prop on a component, so these
  // have to be picked out of the props to reach the DOM.
  const rootAttributes = createMemo(() => {
    const attributes: Record<string, unknown> = {};
    for (const name of Object.keys(props)) {
      if (name.startsWith("data-") || name.startsWith("aria-")) {
        attributes[name] = props[name as keyof typeof props];
      }
    }
    return attributes;
  });

  // null on the first run, so start can fire on mount when isAnimating is true
  // without end firing on mount when it is false. The callbacks are read from
  // props when firing, so changing them does not re-run the effect.
  let prevIsAnimating: boolean | null = null;
  createEffect(() => {
    const isAnimating = props.isAnimating;
    if (props.mode === "static") {
      return;
    }
    const prev = prevIsAnimating;
    prevIsAnimating = isAnimating;
    if (prev === null) {
      if (isAnimating) {
        props.onAnimationStart?.();
      }
      return;
    }
    if (isAnimating && !prev) {
      props.onAnimationStart?.();
    } else if (!isAnimating && prev) {
      props.onAnimationEnd?.();
    }
  });

  const prefixedCn = createMemo(() => createCn(props.prefix));
  // Reads the current prefix on every call, so classes follow prop changes.
  const cn: CnFunction = (...inputs) => prefixedCn()(...inputs);

  const allowedTagNames = createMemo(() =>
    props.allowedTags ? Object.keys(props.allowedTags) : []
  );

  // Apply remend to fix incomplete markdown BEFORE parsing into blocks
  // This prevents partial list items from being interpreted as setext headings
  const processedChildren = createMemo(() => {
    const children: unknown = props.children;
    if (typeof children !== "string") {
      return "";
    }
    let result =
      props.mode === "streaming" && props.parseIncompleteMarkdown
        ? remend(children, props.remend)
        : children;

    // Escape markdown metacharacters inside literal-tag-content tags so that
    // children are rendered as plain text rather than parsed as markdown.
    // This must run BEFORE preprocessCustomTags so that the HTML comments
    // (<!---->) inserted to preserve blank lines are not themselves escaped.
    const literalTagContent = props.literalTagContent;
    if (literalTagContent && literalTagContent.length > 0) {
      result = preprocessLiteralTagContent(result, literalTagContent);
    }

    // Normalize multi-line custom tags: blank-line sandwich so nested markdown
    // parses, plus <!----> placeholders for internal blank lines. Runs after
    // literal escaping so those markers are not corrupted.
    const tagNames = allowedTagNames();
    if (tagNames.length > 0) {
      result = preprocessCustomTags(result, tagNames);
    }

    return result;
  });

  const blocks = createMemo(() =>
    props.parseMarkdownIntoBlocksFn(processedChildren())
  );

  // One getter object for every shared setting; consumers read fields lazily.
  const contextValue: StreamdownContextType = {
    get codeBlockMaxHeight() {
      return props.codeBlockMaxHeight;
    },
    get codeBlockRawLanguages() {
      const languages = props.codeBlockRawLanguages;
      return languages?.length ? languages : undefined;
    },
    get shikiTheme() {
      return (
        props.shikiTheme ??
        props.plugins?.code?.getThemes() ??
        defaultStreamdownContext.shikiTheme
      );
    },
    get controls() {
      return props.controls;
    },
    get isAnimating() {
      return props.isAnimating;
    },
    get lineNumbers() {
      return props.lineNumbers;
    },
    get mode() {
      return props.mode;
    },
    get mermaid() {
      return props.mermaid;
    },
    get linkSafety() {
      return props.linkSafety;
    },
    get portal() {
      return props.portal;
    },
    get tableMaxHeight() {
      return props.tableMaxHeight;
    },
  };

  const pluginsValue: PluginConfig = {
    get cjk() {
      return props.plugins?.cjk;
    },
    get code() {
      return props.plugins?.code;
    },
    get math() {
      return props.plugins?.math;
    },
    get mermaid() {
      return props.plugins?.mermaid;
    },
    get renderers() {
      return props.plugins?.renderers;
    },
  };

  const mergedTranslations = createMemo(() => ({
    ...defaultTranslations,
    ...props.translations,
  }));
  const translationsValue = {} as StreamdownTranslations;
  for (const key of Object.keys(defaultTranslations) as (keyof StreamdownTranslations)[]) {
    Object.defineProperty(translationsValue, key, {
      enumerable: true,
      get: () => mergedTranslations()[key],
    });
  }

  // Merged components, rebuilt only when an input changes. The map must hold
  // plain data properties: the renderer reads entries through their descriptors.
  const mergedComponents = createMemo(() => {
    const { inlineCode, ...userComponents } = props.components ?? {};

    const merged: Record<string, unknown> = {
      ...builtinComponents,
      ...userComponents,
    };

    if (inlineCode) {
      const BlockCode = merged.code;
      // Both targets resolve as the renderer resolves map entries, so a
      // string target passes the render guard and never receives `node`.
      merged.code = (codeProps: CodeProps) => (
        <MappedElement
          {...codeProps}
          component={resolveTarget(
            "code",
            "data-block" in codeProps ? BlockCode : inlineCode
          )}
        />
      );
    }

    const fallbackComponent = props.fallbackComponent;
    if (fallbackComponent) {
      // Eagerly register fallbackComponent for allowedTags entries that have
      // no explicit component in the user-supplied `components` map.
      const allowedTags = props.allowedTags;
      if (allowedTags) {
        for (const tag of Object.keys(allowedTags)) {
          if (!Object.hasOwn(merged, tag)) {
            merged[tag] = fallbackComponent;
          }
        }
      }

      // Wrap in a Proxy so any other tag not explicitly covered (e.g. HTML
      // tags absent from defaultComponents like <span>, <em>, <div>)
      // also uses fallbackComponent instead of rendering as a bare intrinsic
      // element. The renderer resolves components through
      // getOwnPropertyDescriptor, so we intercept it as well as get to
      // satisfy both the presence check and the lookup.
      const fallbackDesc: PropertyDescriptor = {
        configurable: true,
        enumerable: false,
        value: fallbackComponent,
        writable: false,
      };
      return new Proxy(merged as Components, {
        getOwnPropertyDescriptor(target, prop) {
          const ownProp = Object.getOwnPropertyDescriptor(target, prop);
          if (ownProp) {
            return ownProp;
          }
          // Intercept lowercase HTML / custom tag names only.
          if (typeof prop === "string" && LOWERCASE_TAG_PATTERN.test(prop)) {
            return fallbackDesc;
          }
          return undefined;
        },
        get(target, prop, receiver) {
          if (
            typeof prop === "string" &&
            LOWERCASE_TAG_PATTERN.test(prop) &&
            !Object.hasOwn(target, prop)
          ) {
            return fallbackComponent;
          }
          return Reflect.get(target, prop, receiver);
        },
      });
    }

    return merged as Components;
  });

  // Memos over the plugins this component uses, so a new `plugins` object
  // holding the same plugins does not rebuild the plugin arrays.
  const cjkPlugin = createMemo(() => props.plugins?.cjk);
  const mathPlugin = createMemo(() => props.plugins?.math);

  // Merge plugin remark plugins (math, cjk)
  // Order: CJK before -> default (remarkGfm) -> CJK after -> math
  const mergedRemarkPlugins = createMemo(() => {
    const cjk = cjkPlugin();
    const math = mathPlugin();
    let result: PluggableList = [];
    // CJK plugins that must run BEFORE remarkGfm (e.g., remark-cjk-friendly)
    if (cjk) {
      result = [...result, ...cjk.remarkPluginsBefore];
    }
    // Default plugins (includes remarkGfm)
    result = [...result, ...props.remarkPlugins];
    // Optionally strip GFM autolink-literal links for disabled protocols
    // (e.g. mailto). Runs right after remarkGfm since it inspects the
    // link nodes remarkGfm's autolink-literal extension creates. Skipped
    // entirely when unset so default behavior/pipeline is unchanged.
    const disableAutolinkProtocols = props.disableAutolinkProtocols;
    if (disableAutolinkProtocols && disableAutolinkProtocols.length > 0) {
      result = [
        ...result,
        [remarkDisableAutolinkProtocols, disableAutolinkProtocols],
      ];
    }
    // CJK plugins that must run AFTER remarkGfm (e.g., autolink boundary)
    if (cjk) {
      result = [...result, ...cjk.remarkPluginsAfter];
    }
    // Math plugins
    if (math) {
      result = [...result, math.remarkPlugin];
    }
    return result;
  });

  const mergedRehypePlugins = createMemo(() => {
    const rehypePlugins = props.rehypePlugins;
    const allowedTags = props.allowedTags;
    const literalTagContent = props.literalTagContent;
    const math = mathPlugin();
    let result: PluggableList = rehypePlugins;

    // extend sanitization schema with allowedTags. only works with default plugins. if user provides a custom sanitize plugin, they can pass in the custom allowed tags via the plugins object.
    if (
      allowedTags &&
      Object.keys(allowedTags).length > 0 &&
      rehypePlugins === defaultRehypePluginsArray
    ) {
      const extendedSchema = {
        ...defaultSanitizeSchema,
        tagNames: [
          ...(defaultSanitizeSchema.tagNames ?? []),
          ...Object.keys(allowedTags),
        ],
        attributes: {
          ...defaultSanitizeSchema.attributes,
          ...allowedTags,
        },
      };

      result = [
        defaultRehypePlugins.raw,
        [rehypeSanitize, extendedSchema],
        defaultRehypePlugins.harden,
      ];
    }

    if (literalTagContent && literalTagContent.length > 0) {
      result = [...result, [rehypeLiteralTagContent, literalTagContent]];
    }

    if (math) {
      result = [...result, math.rehypePlugin];
    }

    if (props.dir === "auto" && props.mode === "static") {
      result = [...result, rehypeBlockDirection];
    }

    return result;
  });

  // Per-block directions when dir="auto", so detection only re-runs when the
  // blocks or dir change.
  const blockDirections = createMemo(() =>
    props.dir === "auto" ? blocks().map(detectTextDirection) : undefined
  );

  const caretStyle = createMemo(() =>
    props.caret && props.isAnimating
      ? ({ "--streamdown-caret": `"${carets[props.caret]}"` } as JSX.CSSProperties)
      : undefined
  );

  // A `style` key holding undefined still reaches server markup as
  // `style=""`, so the root gets the key only while the caret sets a style.
  const rootStyle = createMemo(() => {
    const style = props.mode === "static" ? undefined : caretStyle();
    return style ? { style } : {};
  });

  const shouldHideCaret = createMemo(() => {
    const all = blocks();
    if (!props.isAnimating || all.length === 0) {
      return false;
    }
    const lastBlock = all[all.length - 1] as string;
    return hasIncompleteCodeFence(lastBlock) || hasTable(lastBlock);
  });

  const { ref: caretHostRef, showCaret } = createCaretHost(
    shouldHideCaret,
    () => blocks()
  );

  return (
    <TranslationsContext.Provider value={translationsValue}>
      <PluginContext.Provider value={pluginsValue}>
        <StreamdownContext.Provider value={contextValue}>
          <PrefixContext.Provider value={cn}>
            <div
              {...rootAttributes()}
              class={cn(
                ROOT_CLASSES,
                props.mode !== "static" && props.caret && showCaret()
                  ? CARET_CLASSES
                  : null,
                props.class
              )}
              dir={
                props.mode === "static" && props.dir !== "auto"
                  ? props.dir
                  : undefined
              }
              ref={caretHostRef}
              {...rootStyle()}
            >
              <Show
                when={props.mode === "static"}
                fallback={
                  // Streaming mode: one block per parsed chunk. Index keeps each
                  // position's block, so a settled block's content never changes.
                  <>
                  <Show
                    when={
                      blocks().length === 0 && props.caret && props.isAnimating
                    }
                  >
                    <span />
                  </Show>
                  <Index each={blocks()}>
                    {(block, index) => (
                      <Dynamic
                        component={props.BlockComponent}
                        components={mergedComponents()}
                        content={block()}
                        dir={
                          blockDirections()?.[index] ??
                          (props.dir !== "auto" ? props.dir : undefined)
                        }
                        index={index}
                        isIncomplete={
                          props.isAnimating &&
                          index === blocks().length - 1 &&
                          hasIncompleteCodeFence(block())
                        }
                        rehypePlugins={mergedRehypePlugins()}
                        remarkPlugins={mergedRemarkPlugins()}
                        shouldNormalizeHtmlIndentation={
                          props.normalizeHtmlIndentation
                        }
                        shouldParseIncompleteMarkdown={
                          props.parseIncompleteMarkdown
                        }
                        {...rest}
                      />
                    )}
                  </Index>
                  </>
                }
              >
                {/* Static mode: simple rendering without streaming features */}
                <Markdown
                  components={mergedComponents()}
                  rehypePlugins={mergedRehypePlugins()}
                  remarkPlugins={mergedRemarkPlugins()}
                  {...rest}
                >
                  {processedChildren()}
                </Markdown>
              </Show>
            </div>
          </PrefixContext.Provider>
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    </TranslationsContext.Provider>
  );
};
