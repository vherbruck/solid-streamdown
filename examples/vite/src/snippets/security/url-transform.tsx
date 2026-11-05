import { defaultUrlTransform, Streamdown } from "solid-streamdown";

const markdown = "Links keep their URL; image sources go through the proxy. [Docs](https://docs.solidjs.com)";

export default function ProxiedImages() {
  return (
    <Streamdown
      urlTransform={(url, key, node) => {
        // Proxy images through your CDN
        if (key === "src") {
          return `https://your-cdn.com/proxy?url=${encodeURIComponent(url)}`;
        }
        return defaultUrlTransform(url, key, node);
      }}
    >
      {markdown}
    </Streamdown>
  );
}
