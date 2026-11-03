import type { Element, Root, RootContent, Text } from "hast";
import {
  type Accessor,
  type Component,
  createComputed,
  createContext,
  createMemo,
  createRenderEffect,
  Index,
  type JSX,
  Match,
  Show,
  Switch,
  sharedConfig,
  splitProps,
  useContext,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Dynamic, escape, getNextElement, isServer, spread } from "solid-js/web";
import { isBlockedElement, type Space, toSolidProps } from "./hast-props";
import type { Components } from "./markdown";

type HastNodeProps = {
  node: RootContent;
  extraProps?: Record<string, unknown>;
};

/**
 * Holds the latest tree from `source` in a store. Each new tree is reconciled
 * into the existing nodes before the DOM updates, so unchanged elements and
 * text keep their DOM nodes.
 *
 * The store adopts the trees it receives and mutates them on later updates,
 * so `source` must produce a fresh tree each time, never a cached one.
 */
const createHastTree = (source: Accessor<Root>): Root => {
  const [tree, setTree] = createStore<Root>({ type: "root", children: [] });
  createComputed(() => setTree(reconcile(source(), { merge: true })));
  return tree;
};

/** Components used in place of intrinsic elements, keyed by tag name. */
const RenderContext = createContext<Accessor<Components>>(() => ({}));

const SpaceContext = createContext<Accessor<Space>>((): Space => "html");

// React's server renderer escapes `<style` and `</style` in style text this
// way (escapeStyleTextContent in react-dom): the `s` becomes a CSS escape for
// the same letter, so the CSS is unchanged.
const STYLE_TAG = /(<\/|<)(s)(tyle)/gi;
const escapeStyleText = (text: string): string =>
  text.replace(
    STYLE_TAG,
    (_, prefix: string, s: string, suffix: string) =>
      `${prefix}${s === "s" ? "\\73 " : "\\53 "}${suffix}`
  );

/**
 * Server only: how the text directly inside an element is escaped. Solid's
 * server renderer writes a `style` element's children unescaped, so style
 * text reading `</style>` would close the element and the rest would render
 * as markup. In HTML, style content is raw text and gets React's escape.
 * Inside svg or math, the browser parses style content as markup and decodes
 * entities, so it is escaped as ordinary text.
 */
type ServerTextScope = { foreign: boolean; escape?: (text: string) => string };

const ServerTextContext = createContext<ServerTextScope>({ foreign: false });

const FOREIGN_ROOTS = new Set(["svg", "math"]);

const serverTextScope = (parent: ServerTextScope, tagName: string): ServerTextScope => {
  const tag = tagName.toLowerCase();
  const foreign = parent.foreign || FOREIGN_ROOTS.has(tag);
  if (tag !== "style") {
    return { foreign };
  }
  return { foreign, escape: foreign ? (text) => escape(text) : escapeStyleText };
};

// A text node of our own, updated through `.data`, keeps its DOM identity as
// text streams in. Solid's own text insertion replaces the node whenever an
// array child's string changes.
const HastText: Component<{ node: Text }> = (props) => {
  if (isServer) {
    const scope = useContext(ServerTextContext);
    return scope.escape ? scope.escape(props.node.value) : props.node.value;
  }
  if (sharedConfig.context) {
    return hydratingText(props);
  }
  const text = document.createTextNode("");
  createRenderEffect(() => {
    text.data = props.node.value;
  });
  return text;
};

// While hydrating, Solid adopts the server-rendered text node only when it is
// given a string: a node created here would stay detached, so its updates
// would never reach the page. Hand Solid the string until hydration ends, then
// switch to our own node on the first update and keep it from then on. The
// parent re-reads this for any sibling's change, so only write changed text.
const hydratingText = (props: { node: Text }): JSX.Element => {
  let text: globalThis.Text | undefined;
  const read = () => {
    const value = props.node.value;
    if (!text && sharedConfig.context) {
      return value;
    }
    text ??= document.createTextNode("");
    if (text.data !== value) {
      text.data = value;
    }
    return text;
  };
  // Solid inserts accessors reactively, but JSX.Element does not list them.
  return read as unknown as JSX.Element;
};

// HTML elements whose content the parser reads as text up to the matching end
// tag. An element child's attribute could hold that end tag, which escapes
// only `"` and `&` on the server, so these elements render their text only.
const RAW_TEXT_TAGS = new Set([
  "iframe",
  "noembed",
  "noframes",
  "noscript",
  "style",
  "textarea",
  "title",
  "xmp",
]);

/** The text of `nodes` and their descendants, reading through the store. */
const hastTextContent = (nodes: readonly RootContent[]): string => {
  let result = "";
  for (const node of nodes) {
    if (node.type === "text") {
      result += node.value;
    } else if (node.type === "element") {
      result += hastTextContent(node.children);
    }
  }
  return result;
};

// Elements with no content. The server never renders their children, so the
// client must not create child components for them either (see HastElement).
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "menuitem",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** What an element renders as: a component, a tag name, or nothing. */
type RenderTarget = Component<any> | string | undefined;

/**
 * Resolves what `tagName` renders as, given its components-map entry. The tag
 * and any replacement tag pass the render guard, and resolve to `undefined`
 * (render nothing) when blocked. A missing or empty-string entry renders the
 * tag itself.
 */
const resolveTarget = (tagName: string, mapped: unknown): RenderTarget => {
  if (isBlockedElement(tagName)) {
    return undefined;
  }
  if (typeof mapped === "function") {
    return mapped as Components[string];
  }
  // A replacement tag passes the same guard, and renders nothing when blocked.
  if (typeof mapped === "string" && mapped !== "") {
    return isBlockedElement(mapped) ? undefined : mapped;
  }
  return tagName;
};

const NAMESPACE_URIS = {
  svg: "http://www.w3.org/2000/svg",
  math: "http://www.w3.org/1998/Math/MathML",
} as const;

// MathML elements whose children the HTML parser treats as HTML again
// (text integration points; mglyph and malignmark stay MathML).
const MATHML_TEXT_INTEGRATION = new Set(["mi", "mo", "mn", "ms", "mtext"]);

/** The space an element's children are created in, as the HTML parser does. */
const childSpace = (space: Space, node: Element): Space => {
  const tag = node.tagName.toLowerCase();
  if (space === "svg" && tag === "foreignobject") {
    return "html";
  }
  if (space === "math") {
    if (MATHML_TEXT_INTEGRATION.has(tag)) {
      return "html";
    }
    if (tag === "annotation-xml") {
      const encoding = String(node.properties?.encoding ?? "").toLowerCase();
      if (encoding === "text/html" || encoding === "application/xhtml+xml") {
        return "html";
      }
    }
  }
  return space;
};

/**
 * Creates an SVG or MathML element in its namespace. Solid's Dynamic picks a
 * namespace from a fixed list of SVG tag names, so it would create MathML,
 * and SVG's `a`, `title` and `style`, as HTML elements. Client only: the
 * server writes markup, which the browser parses into the right namespace.
 * Props are set as attributes (Solid's SVG path) for MathML too.
 */
const NamespacedElement: Component<
  Record<string, unknown> & { tag: string; namespace: "svg" | "math" }
> = (props) => {
  const [local, others] = splitProps(props, ["tag", "namespace", "component"]);
  const element = sharedConfig.context
    ? getNextElement()
    : document.createElementNS(NAMESPACE_URIS[local.namespace], local.tag);
  spread(element, others, true);
  return element;
};

// `component` is safe as the target's prop name: the render guard drops it
// from every element's props.
type MappedElementProps = Record<string, unknown> & {
  component: RenderTarget;
  node?: Element;
  /** The namespace a tag-name target is created in (HTML when omitted). */
  namespace?: Space;
};

/**
 * Renders a target from `resolveTarget` with the given props. A component
 * receives `node`; a tag name never does, so the HAST node cannot reach the
 * DOM as an attribute. An `undefined` target renders nothing.
 */
const MappedElement: Component<MappedElementProps> = (props) => {
  const [, componentProps] = splitProps(props, ["namespace"]);
  const [, tagProps] = splitProps(props, ["node", "namespace"]);
  const foreignNamespace = () =>
    !isServer && (props.namespace === "svg" || props.namespace === "math")
      ? props.namespace
      : undefined;
  return (
    <Switch>
      <Match when={typeof props.component === "function"}>
        <Dynamic {...componentProps} component={props.component} />
      </Match>
      <Match when={typeof props.component === "string" && foreignNamespace()}>
        {(namespace) => (
          <Show keyed when={props.component as string}>
            {(tag) => <NamespacedElement {...tagProps} namespace={namespace()} tag={tag} />}
          </Show>
        )}
      </Match>
      <Match when={typeof props.component === "string"}>
        <Dynamic {...tagProps} component={props.component} />
      </Match>
    </Switch>
  );
};

const HastElement: Component<{ node: Element; extraProps?: Record<string, unknown> }> = (
  props
) => {
  const components = useContext(RenderContext);
  const parentSpace = useContext(SpaceContext);
  // The element's own namespace: svg and math start one, anything else stays
  // in its parent's. Its children may switch back to HTML (childSpace).
  const space = createMemo<Space>(() => {
    const tag = props.node.tagName.toLowerCase();
    return tag === "svg" ? "svg" : tag === "math" ? "math" : parentSpace();
  });
  const innerSpace = createMemo<Space>(() => childSpace(space(), props.node));
  // Read through the descriptor so a Proxy-backed map can supply fallbacks.
  // Entries must therefore be data properties, not getters.
  const target = createMemo(() =>
    resolveTarget(
      props.node.tagName,
      Object.getOwnPropertyDescriptor(components(), props.node.tagName)?.value
    )
  );

  // On the server, tell the text inside how to escape itself; a component
  // target is judged by the element's own tag. The provider is called as a
  // function, not through JSX: as a component it would take a hydration key
  // that the client, which renders no provider, never takes.
  const textScope = isServer ? useContext(ServerTextContext) : undefined;
  const rawText = createMemo(() => {
    const rendered = target();
    return (
      space() === "html" && typeof rendered === "string" && RAW_TEXT_TAGS.has(rendered.toLowerCase())
    );
  });
  // A void tag gets no children: Solid's server renderer skips them, and on
  // the client the spread would still create (empty) child components, which
  // shifts hydration keys wherever the element shares a key scope.
  const isVoid = createMemo(() => {
    const rendered = target();
    return typeof rendered === "string" && VOID_TAGS.has(rendered.toLowerCase());
  });
  const content = (): JSX.Element =>
    isVoid() ? undefined : rawText() ? (
      <HastText
        node={{
          type: "text",
          get value() {
            return hastTextContent(props.node.children);
          },
        }}
      />
    ) : (
      <HastNodes nodes={props.node.children} />
    );
  const children = (): JSX.Element => {
    if (!textScope) {
      return content();
    }
    const rendered = target();
    const tag = typeof rendered === "string" ? rendered : props.node.tagName;
    return ServerTextContext.Provider({
      value: serverTextScope(textScope, tag),
      get children() {
        return content();
      },
    });
  };

  return (
    <SpaceContext.Provider value={innerSpace}>
      <MappedElement
        {...toSolidProps(props.node, space())}
        {...props.extraProps}
        node={props.node}
        component={target()}
        namespace={space()}
      >
        {children()}
      </MappedElement>
    </SpaceContext.Provider>
  );
};

/** Renders one HAST node. `raw`, `comment` and `doctype` nodes render nothing. */
const HastNode: Component<HastNodeProps> = (props) => (
  <Switch>
    <Match when={props.node.type === "text"}>
      <HastText node={props.node as Text} />
    </Match>
    <Match when={props.node.type === "element"}>
      <HastElement node={props.node as Element} extraProps={props.extraProps} />
    </Match>
  </Switch>
);

/** Renders a list of HAST nodes, reusing each position's DOM across updates. */
const HastNodes: Component<{ nodes: readonly RootContent[] }> = (props) => (
  <Index each={props.nodes}>{(node) => <HastNode node={node()} />}</Index>
);

export {
  createHastTree,
  HastNode,
  HastNodes,
  hastTextContent,
  MappedElement,
  RenderContext,
  resolveTarget,
};
