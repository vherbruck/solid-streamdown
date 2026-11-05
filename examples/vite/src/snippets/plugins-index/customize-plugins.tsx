import { defaultRehypePlugins, defaultRemarkPlugins, Streamdown } from "solid-streamdown";

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const textOf = (node: HastNode): string =>
  node.value ?? node.children?.map(textOf).join("") ?? "";

// A rehype plugin that gives every heading an id built from its text
const rehypeHeadingIds = () => (tree: HastNode) => {
  const visit = (node: HastNode) => {
    if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
      const id = textOf(node).toLowerCase().trim().replace(/\W+/g, "-");
      node.properties = { ...node.properties, id };
    }
    node.children?.forEach(visit);
  };
  visit(tree);
};

const markdown = "## Custom plugins\n\nThis heading gets an `id`.";

export default function CustomizePlugins() {
  return (
    <Streamdown
      remarkPlugins={Object.values(defaultRemarkPlugins)}
      rehypePlugins={[...Object.values(defaultRehypePlugins), rehypeHeadingIds]}
    >
      {markdown}
    </Streamdown>
  );
}
