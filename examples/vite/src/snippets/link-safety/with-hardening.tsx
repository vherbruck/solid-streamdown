import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = "[Trusted](https://trusted.com/page) and [other](https://example.com).";

export default function SecureChat() {
  return (
    <Streamdown
      linkSafety={{
        enabled: true,
        onLinkCheck: (url) => url.startsWith("https://trusted.com"),
      }}
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        [
          harden,
          {
            defaultOrigin: "https://trusted.com",
            allowedLinkPrefixes: ["https://trusted.com", "https://github.com"],
          },
        ],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
