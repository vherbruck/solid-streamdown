/**
 * Ported from vercel/streamdown packages/streamdown/lib/components.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import type { Element, ElementContent, RootContent } from "hast";
import {
  type Component,
  createMemo,
  createSignal,
  type JSX,
  Match,
  Show,
  Suspense,
  Switch,
  splitProps,
  useContext,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { useIsCodeFenceIncomplete } from "./block-incomplete-context";
import { CodeBlock } from "./code-block";
import { CodeBlockCopyButton } from "./code-block/copy-button";
import { CodeBlockDownloadButton } from "./code-block/download-button";
import { CodeBlockSkeleton } from "./code-block/skeleton";
import { HastNode, HastNodes, hastTextContent, RenderContext } from "./hast-render";
import { ImageComponent } from "./image";
import { LinkSafetyModal } from "./link-modal";
import { Mermaid } from "./mermaid";
import { MermaidDownloadDropdown } from "./mermaid/download-button";
import { MermaidFullscreenButton } from "./mermaid/fullscreen-button";
import type { Components, ExtraProps } from "./markdown";
import { useCustomRenderer, useMermaidPlugin } from "./plugin-context";
import { PhrasingContext } from "./phrasing-context";
import { useCn } from "./prefix-context";
import { RawCodeBlock } from "./raw-code-block";
import { getCopyCallbacks } from "./controls";
import {
  type ControlsConfig,
  type LinkSafetyModalProps,
  StreamdownContext,
} from "./streamdown-context";
import { Table } from "./table";
import { useUi } from "./ui-context";

type ElementProps = Omit<JSX.HTMLAttributes<HTMLElement>, "ref"> & ExtraProps;

const isWhitespaceText = (node: RootContent): boolean =>
  node.type === "text" && node.value.trim() === "";

/** The element's children that are not whitespace-only text. */
const contentChildren = (node: Element | undefined): ElementContent[] =>
  node ? node.children.filter((child) => !isWhitespaceText(child)) : [];

const isElement = (node: RootContent | undefined): node is Element => node?.type === "element";

/**
 * Builds a component that renders `tag` with Tailwind classes and a
 * `data-streamdown` marker. Rest props come first so the fixed props win.
 */
const styled = (tag: string, classes: string, marker: string): Component<ElementProps> => (props) => {
  const cn = useCn();
  const [local, rest] = splitProps(props, ["node", "children", "class"]);
  return (
    <Dynamic
      component={tag}
      {...rest}
      class={cn(classes, local.class)}
      data-streamdown={marker}
    >
      {local.children}
    </Dynamic>
  );
};

const Ol = styled(
  "ol",
  "list-inside list-decimal whitespace-normal [li_&]:ps-6",
  "ordered-list"
);
const Ul = styled(
  "ul",
  "list-inside list-disc whitespace-normal [li_&]:ps-6",
  "unordered-list"
);
const Strong = styled("span", "font-semibold", "strong");
const H1 = styled("h1", "mt-6 mb-2 font-semibold text-3xl", "heading-1");
const H2 = styled("h2", "mt-6 mb-2 font-semibold text-2xl", "heading-2");
const H3 = styled("h3", "mt-6 mb-2 font-semibold text-xl", "heading-3");
const H4 = styled("h4", "mt-6 mb-2 font-semibold text-lg", "heading-4");
const H5 = styled("h5", "mt-6 mb-2 font-semibold text-base", "heading-5");
const H6 = styled("h6", "mt-6 mb-2 font-semibold text-sm", "heading-6");
const Thead = styled("thead", "bg-muted/80", "table-header");
const Tbody = styled("tbody", "divide-y divide-border", "table-body");
const Tr = styled("tr", "border-border", "table-row");
const Th = styled(
  "th",
  "whitespace-nowrap px-4 py-2 text-start font-semibold text-sm",
  "table-header-cell"
);
const Td = styled("td", "px-4 py-2 text-sm", "table-cell");
const Blockquote = styled(
  "blockquote",
  "my-4 border-muted-foreground/30 border-s-4 ps-4 text-muted-foreground italic",
  "blockquote"
);
const Sup = styled("sup", "text-sm", "superscript");
const Sub = styled("sub", "text-sm", "subscript");

const Hr: Component<ElementProps> = (props) => {
  const cn = useCn();
  const [local, rest] = splitProps(props, ["node", "children", "class"]);
  return <hr {...(rest as JSX.HTMLAttributes<HTMLHRElement>)} class={cn("my-6 border-border", local.class)} data-streamdown="horizontal-rule" />;
};

// Upstream drops only "\n" and "" children before looking for a lone paragraph.
const shouldShowControls = (
  config: ControlsConfig,
  type: "table" | "code" | "mermaid" | "image"
) => {
  if (typeof config === "boolean") {
    return config;
  }

  return config[type] !== false;
};

const shouldShowImageControl = (config: ControlsConfig, controlType: "download"): boolean => {
  if (typeof config === "boolean") {
    return config;
  }

  const imageConfig = config.image;

  if (imageConfig === false) {
    return false;
  }

  if (imageConfig === true || imageConfig === undefined) {
    return true;
  }

  return imageConfig[controlType] !== false;
};

const shouldShowTableControl = (
  config: ControlsConfig,
  controlType: "copy" | "download" | "fullscreen"
): boolean => {
  if (typeof config === "boolean") {
    return config;
  }

  const tableConfig = config.table;

  if (tableConfig === false) {
    return false;
  }

  if (tableConfig === true || tableConfig === undefined) {
    return true;
  }

  return tableConfig[controlType] !== false;
};

const TableComponent: Component<ElementProps> = (props) => {
  const context = useContext(StreamdownContext);
  return (
    <Table
      {...(props as Parameters<typeof Table>[0])}
      maxHeight={context.tableMaxHeight}
      showControls={shouldShowControls(context.controls, "table")}
      showCopy={shouldShowTableControl(context.controls, "copy")}
      showDownload={shouldShowTableControl(context.controls, "download")}
      showFullscreen={shouldShowTableControl(context.controls, "fullscreen")}
    />
  );
};

const Img: Component<ElementProps> = (props) => {
  const context = useContext(StreamdownContext);
  const showImageControls = () => shouldShowControls(context.controls, "image");
  return (
    <ImageComponent
      {...(props as Parameters<typeof ImageComponent>[0])}
      showControls={showImageControls()}
      showDownloadControl={
        showImageControls() && shouldShowImageControl(context.controls, "download")
      }
    />
  );
};

const INCOMPLETE_LINK = "streamdown:incomplete-link";

const openInNewTab = (href: string) => {
  window.open(href, "_blank", "noreferrer");
};

const A: Component<ElementProps & { href?: string }> = (props) => {
  const cn = useCn();
  const ui = useUi();
  const context = useContext(StreamdownContext);
  const [local, rest] = splitProps(props, ["node", "children", "class", "href"]);
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const isIncomplete = () => local.href === INCOMPLETE_LINK;
  const isGuarded = () => Boolean(context.linkSafety?.enabled && local.href);

  const handleClick = async (event: MouseEvent) => {
    const linkSafety = context.linkSafety;
    const href = local.href;
    if (!(linkSafety?.enabled && href) || isIncomplete()) {
      return;
    }

    event.preventDefault();

    if (linkSafety.onLinkCheck) {
      const isAllowed = await linkSafety.onLinkCheck(href);
      if (isAllowed) {
        openInNewTab(href);
        return;
      }
    }

    setIsModalOpen(true);
  };

  const modalProps: LinkSafetyModalProps = {
    get url() {
      return local.href ?? "";
    },
    get isOpen() {
      return isModalOpen();
    },
    onClose: () => setIsModalOpen(false),
    onConfirm: () => {
      if (local.href) {
        openInNewTab(local.href);
      }
    },
  };

  return (
    <Show
      fallback={
        <a
          {...(rest as JSX.AnchorHTMLAttributes<HTMLAnchorElement>)}
          class={cn("wrap-anywhere font-medium text-primary underline", local.class)}
          data-incomplete={isIncomplete()}
          data-streamdown="link"
          href={local.href}
          rel="noreferrer"
          target="_blank"
        >
          {local.children}
        </a>
      }
      when={isGuarded()}
    >
      <ui.Button
        class={cn(
          "wrap-anywhere appearance-none text-start font-medium text-primary underline",
          local.class
        )}
        data-incomplete={isIncomplete()}
        data-streamdown="link"
        onClick={handleClick}
        type="button"
      >
        {local.children}
      </ui.Button>
      {context.linkSafety?.renderModal ? (
        context.linkSafety.renderModal(modalProps)
      ) : (
        <LinkSafetyModal {...modalProps} />
      )}
    </Show>
  );
};

const isLineBreakText = (node: RootContent): boolean =>
  node.type === "text" && (node.value === "\n" || node.value === "");

const Li: Component<ElementProps> = (props) => {
  const cn = useCn();
  const components = useContext(RenderContext);
  const [local, rest] = splitProps(props, ["node", "children", "class"]);
  // A list item whose only content is a paragraph renders that paragraph's
  // children directly, so tight and loose lists look alike. As upstream, only
  // the built-in paragraph is unwrapped; a consumer's own `p` is kept.
  const onlyParagraph = createMemo(() => {
    if (Object.getOwnPropertyDescriptor(components(), "p")?.value !== P) {
      return undefined;
    }
    const content = props.node?.children.filter((child) => !isLineBreakText(child)) ?? [];
    const [only] = content;
    return content.length === 1 && isElement(only) && only.tagName === "p" ? only : undefined;
  });
  return (
    <li {...(rest as JSX.LiHTMLAttributes<HTMLLIElement>)} class={cn("py-1 [&>p]:inline", local.class)} data-streamdown="list-item">
      <Show when={onlyParagraph()} fallback={local.children}>
        {(paragraph) => <HastNodes nodes={paragraph().children} />}
      </Show>
    </li>
  );
};

const P: Component<ElementProps> = (props) => {
  // `class` stays in the spread, so the server writes no `class=""` when the
  // paragraph has none.
  const [local, rest] = splitProps(props, ["node", "children"]);
  // An image or block code renders as a <div>, which cannot sit inside a <p>.
  // Upstream's valid-children filter drops only null, undefined and "", so
  // whitespace-only text counts as a child and keeps the <p>; HAST has no
  // empty children, so the filter is a no-op here.
  const unwrapped = createMemo(() => {
    const content = props.node?.children ?? [];
    const [only] = content;
    return (
      content.length === 1 &&
      isElement(only) &&
      (only.tagName === "img" || (only.tagName === "code" && only.properties?.dataBlock !== undefined))
    );
  });
  return (
    <Show when={!unwrapped()} fallback={local.children}>
      <p {...(rest as JSX.HTMLAttributes<HTMLParagraphElement>)}>
        <PhrasingContext.Provider value={true}>{local.children}</PhrasingContext.Provider>
      </p>
    </Show>
  );
};

const Pre: Component<ElementProps> = (props) => {
  // The pre wrapper adds nothing of its own; the code child draws the block.
  const onlyCode = createMemo(() => {
    const content = contentChildren(props.node);
    const [only] = content;
    return content.length === 1 && isElement(only) && only.tagName === "code" ? only : undefined;
  });
  return (
    <Show when={onlyCode()} fallback={props.children}>
      {(code) => <HastNode node={code()} extraProps={{ "data-block": "true" }} />}
    </Show>
  );
};

const shouldShowCodeControl = (
  config: ControlsConfig,
  controlType: "copy" | "download"
): boolean => {
  if (typeof config === "boolean") {
    return config;
  }

  const codeConfig = config.code;

  if (codeConfig === false) {
    return false;
  }

  if (codeConfig === true || codeConfig === undefined) {
    return true;
  }

  return codeConfig[controlType] !== false;
};

const START_LINE_PATTERN = /startLine=(\d+)/;
const NO_LINE_NUMBERS_PATTERN = /\bnoLineNumbers\b/;
const LANGUAGE_REGEX = /language-([^\s]+)/;

const shouldShowMermaidControl = (
  config: ControlsConfig,
  controlType: "download" | "copy" | "fullscreen" | "panZoom"
): boolean => {
  if (typeof config === "boolean") {
    return config;
  }

  const mermaidConfig = config.mermaid;

  if (mermaidConfig === false) {
    return false;
  }

  if (mermaidConfig === true || mermaidConfig === undefined) {
    return true;
  }

  return mermaidConfig[controlType] !== false;
};

/** A Mermaid fence, rendered as a diagram with its controls. */
const MermaidBlock: Component<{ chart: string; class?: string }> = (props) => {
  const cn = useCn();
  const context = useContext(StreamdownContext);
  const show = (control: "download" | "copy" | "fullscreen" | "panZoom") =>
    shouldShowMermaidControl(context.controls, control);
  const showActions = () =>
    shouldShowControls(context.controls, "mermaid") &&
    (show("download") || show("copy") || show("fullscreen"));

  return (
    <div
      class={cn(
        "group relative my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2",
        props.class
      )}
      data-streamdown="mermaid-block"
    >
      <div class={cn("flex h-8 items-center text-muted-foreground text-xs")}>
        <span class={cn("ms-1 font-mono lowercase")}>mermaid</span>
      </div>
      <Show when={showActions()}>
        <div class={cn("pointer-events-none absolute end-2 top-2 z-10 flex items-center")}>
          <div
            class={cn(
              "pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur"
            )}
            data-streamdown="mermaid-block-actions"
          >
            <Show when={show("download")}>
              <MermaidDownloadDropdown chart={props.chart} config={context.mermaid?.config} />
            </Show>
            <Show when={show("copy")}>
              <CodeBlockCopyButton
                code={props.chart}
                {...getCopyCallbacks(context.controls, "mermaid")}
              />
            </Show>
            <Show when={show("fullscreen")}>
              <MermaidFullscreenButton chart={props.chart} config={context.mermaid?.config} />
            </Show>
          </div>
        </div>
      </Show>
      <div class={cn("overflow-hidden rounded-md border border-border bg-background")}>
        <Mermaid chart={props.chart} config={context.mermaid?.config} showControls={show("panZoom")} />
      </div>
    </div>
  );
};

/** A fenced code block: a custom renderer, a raw block or the code block. */
const BlockCode: Component<ElementProps> = (props) => {
  const [local, forwarded] = splitProps(props, ["node", "children", "class"]);
  const context = useContext(StreamdownContext);
  const mermaidPlugin = useMermaidPlugin();
  const isBlockIncomplete = useIsCodeFenceIncomplete();

  const language = () => local.class?.match(LANGUAGE_REGEX)?.at(1) ?? "";
  const customRenderer = useCustomRenderer(language);

  // Parse startLine from the code fence meta string (e.g. ```js startLine=10)
  const metastring = () => {
    const value = local.node?.properties?.metastring;
    return typeof value === "string" ? value : undefined;
  };
  const startLine = () => {
    const match = metastring()?.match(START_LINE_PATTERN);
    const parsed = match ? Number.parseInt(match[1] as string, 10) : undefined;
    return parsed !== undefined && parsed >= 1 ? parsed : undefined;
  };

  // Parse noLineNumbers from meta string and derive effective lineNumbers
  const showLineNumbers = () => {
    const meta = metastring();
    const metaNoLineNumbers = meta ? NO_LINE_NUMBERS_PATTERN.test(meta) : false;
    return !metaNoLineNumbers && context.lineNumbers !== false;
  };

  // The code is the text of the code element. Without a node (the component
  // rendered directly), fall back to a string child, as upstream reads it.
  const code = createMemo(() => {
    if (local.node) {
      return hastTextContent(local.node.children);
    }
    const children = local.children;
    return typeof children === "string" ? children : "";
  });

  const isRawLanguage = () => {
    const lang = language();
    return Boolean(
      lang &&
        context.codeBlockRawLanguages?.includes(lang) &&
        !(lang === "mermaid" && mermaidPlugin())
    );
  };

  return (
    <Switch
      fallback={
        <CodeBlock
          {...(forwarded as JSX.HTMLAttributes<HTMLDivElement>)}
          class={local.class}
          code={code()}
          isIncomplete={isBlockIncomplete()}
          language={language()}
          lineNumbers={showLineNumbers()}
          startLine={startLine()}
        >
          <Show when={shouldShowControls(context.controls, "code")}>
            <Show when={shouldShowCodeControl(context.controls, "download")}>
              <CodeBlockDownloadButton code={code()} language={language()} />
            </Show>
            <Show when={shouldShowCodeControl(context.controls, "copy")}>
              <CodeBlockCopyButton {...getCopyCallbacks(context.controls, "code")} />
            </Show>
          </Show>
        </CodeBlock>
      }
    >
      <Match when={customRenderer()}>
        {(renderer) => (
          <Suspense fallback={<CodeBlockSkeleton />}>
            <Dynamic
              code={code()}
              component={renderer().component}
              isIncomplete={isBlockIncomplete()}
              language={language()}
              meta={metastring()}
            />
          </Suspense>
        )}
      </Match>
      <Match when={isRawLanguage()}>
        <RawCodeBlock code={code()} isIncomplete={isBlockIncomplete()} language={language()} />
      </Match>
      <Match when={language() === "mermaid" && mermaidPlugin()}>
        <MermaidBlock chart={code()} class={local.class} />
      </Match>
    </Switch>
  );
};

const Code: Component<ElementProps & { "data-block"?: string }> = (props) => {
  const cn = useCn();
  const [local, rest] = splitProps(props, ["node", "children", "class", "data-block"]);
  // A code element is block-level when it was inside a <pre> element.
  // The custom pre component marks its children with data-block, an internal
  // marker that is not forwarded.
  const inline = () => !("data-block" in props);
  return (
    <Show
      when={inline()}
      fallback={<BlockCode {...rest} class={local.class} node={local.node} />}
    >
      <code
        {...rest}
        class={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", local.class)}
        data-streamdown="inline-code"
      >
        {local.children}
      </code>
    </Show>
  );
};

/** True when a footnote item has a backref link and no other content. */
const isEmptyFootnote = (item: ElementContent): boolean => {
  if (!isElement(item)) {
    return false;
  }
  let hasContent = false;
  let hasBackref = false;
  for (const child of item.children) {
    if (child.type === "text") {
      hasContent ||= child.value.trim() !== "";
    } else if (isElement(child)) {
      if (child.properties?.dataFootnoteBackref !== undefined) {
        hasBackref = true;
      } else if (
        child.children.some(
          (grandChild) =>
            (grandChild.type === "text" && grandChild.value.trim() !== "") ||
            (isElement(grandChild) && grandChild.properties?.dataFootnoteBackref === undefined)
        )
      ) {
        hasContent = true;
      }
    }
  }
  return hasBackref && !hasContent;
};

const Section: Component<ElementProps> = (props) => {
  // `class` stays in the spread, as in `P`.
  const [local, rest] = splitProps(props, ["node", "children"]);
  const isFootnotes = () => "data-footnotes" in props;
  // Footnote items that hold only the backref appear while a definition is
  // still streaming in. Drop them, and drop the list if no real item remains.
  // Mapping from React children: upstream sees "\n" strings as children of the
  // section and the list, which HAST also has as text nodes. At section level
  // they count as content, as in upstream, so the section survives with its
  // heading. In the list they are not items (the ruling R14 mapping), so a list
  // of only empty footnotes and "\n" is removed. The section itself goes only
  // when no child at all remains.
  const footnoteChildren = createMemo((): RootContent[] | undefined => {
    if (!(isFootnotes() && props.node)) {
      return undefined;
    }
    return props.node.children.flatMap((child): RootContent[] => {
      if (!(isElement(child) && child.tagName === "ol")) {
        return [child];
      }
      const items = child.children.filter((item) => !isEmptyFootnote(item));
      if (items.every(isWhitespaceText)) {
        return [];
      }
      return [{ ...child, children: items }];
    });
  });
  return (
    <Show
      when={footnoteChildren()}
      // Not footnotes, or rendered without a HAST node (directly, by an app):
      // the children are rendered as given, unfiltered.
      fallback={<section {...(rest as JSX.HTMLAttributes<HTMLElement>)}>{local.children}</section>}
    >
      {(nodes) => (
        <Show when={nodes().length > 0}>
          <section {...(rest as JSX.HTMLAttributes<HTMLElement>)}>
            <HastNodes nodes={nodes()} />
          </section>
        </Show>
      )}
    </Show>
  );
};

// The element-specific prop types differ only in event-handler targets, which
// these components forward untouched, so one shared prop type is sound.
export const components = {
  a: A,
  ol: Ol,
  li: Li,
  ul: Ul,
  hr: Hr,
  strong: Strong,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  thead: Thead,
  tbody: Tbody,
  tr: Tr,
  th: Th,
  td: Td,
  blockquote: Blockquote,
  code: Code,
  pre: Pre,
  img: Img,
  table: TableComponent,
  sup: Sup,
  sub: Sub,
  p: P,
  section: Section,
} as Components;
