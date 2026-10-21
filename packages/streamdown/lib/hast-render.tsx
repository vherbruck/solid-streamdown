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
  Switch,
  sharedConfig,
  useContext,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Dynamic, isServer } from "solid-js/web";
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

// A text node of our own, updated through `.data`, keeps its DOM identity as
// text streams in. Solid's own text insertion replaces the node whenever an
// array child's string changes.
const HastText: Component<{ node: Text }> = (props) => {
  if (isServer) {
    return props.node.value;
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

const HastElement: Component<{ node: Element; extraProps?: Record<string, unknown> }> = (
  props
) => {
  const components = useContext(RenderContext);
  const parentSpace = useContext(SpaceContext);
  const space = createMemo<Space>(() =>
    parentSpace() === "svg" || props.node.tagName.toLowerCase() === "svg" ? "svg" : "html"
  );
  const target = createMemo(() => {
    const { tagName } = props.node;
    if (isBlockedElement(tagName)) {
      return undefined;
    }
    // Read through the descriptor so a Proxy-backed map can supply fallbacks.
    // Entries must therefore be data properties, not getters.
    const mapped: unknown = Object.getOwnPropertyDescriptor(components(), tagName)?.value;
    if (typeof mapped === "function") {
      return mapped as Components[string];
    }
    // A replacement tag passes the same guard, and renders nothing when blocked.
    if (typeof mapped === "string" && mapped !== "") {
      return isBlockedElement(mapped) ? undefined : mapped;
    }
    return tagName;
  });

  return (
    <SpaceContext.Provider value={space}>
      <Switch>
        <Match when={typeof target() === "function"}>
          <Dynamic
            {...toSolidProps(props.node, space())}
            {...props.extraProps}
            node={props.node}
            component={target()}
          >
            <HastNodes nodes={props.node.children} />
          </Dynamic>
        </Match>
        <Match when={typeof target() === "string"}>
          <Dynamic {...toSolidProps(props.node, space())} {...props.extraProps} component={target()}>
            <HastNodes nodes={props.node.children} />
          </Dynamic>
        </Match>
      </Switch>
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

export { createHastTree, HastNode, HastNodes, RenderContext };
