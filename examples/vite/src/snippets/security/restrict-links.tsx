import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = `[Safe link](https://github.com/vercel/streamdown)
[Unsafe link](https://malicious-site.com)`;

export default function Page() {
  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        [
          harden,
          {
            defaultOrigin: "https://your-app.com",
            allowedLinkPrefixes: ["https://your-app.com", "https://github.com"],
          },
        ],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
