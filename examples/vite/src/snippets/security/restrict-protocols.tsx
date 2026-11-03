import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = "[Docs](https://docs.solidjs.com), [mail](mailto:team@example.com), [call](tel:+15550100)";

export default function Page() {
  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        [
          harden,
          {
            // Keep every http(s) URL: these lists default to [], which blocks them all.
            allowedLinkPrefixes: ["*"],
            allowedImagePrefixes: ["*"],
            // No protocols beyond harden's built-in safe set, so tel: is blocked.
            allowedProtocols: [],
          },
        ],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
