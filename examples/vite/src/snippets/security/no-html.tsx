import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = "This <b>tag</b> is shown as text.";

export default function Page() {
  return (
    <Streamdown
      rehypePlugins={[
        // Omit defaultRehypePlugins.raw to disable HTML
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        defaultRehypePlugins.harden,
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
