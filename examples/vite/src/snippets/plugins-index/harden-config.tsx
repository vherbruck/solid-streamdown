import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

// #region defaults
const hardenOptions = {
  allowedImagePrefixes: ["*"],
  allowedLinkPrefixes: ["*"],
  allowedProtocols: ["*"],
  defaultOrigin: undefined,
  allowDataImages: true,
};
// #endregion

const markdown = "A [link](https://example.com) checked by rehype-harden.";

export default function HardenConfig() {
  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        [harden, hardenOptions],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
