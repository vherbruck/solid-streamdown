import { defaultUrlTransform, Streamdown } from "solid-streamdown";

const markdown = "Read the [docs](https://example.com/docs).";

export default function Page() {
  // Proxy all image URLs through your CDN
  return (
    <Streamdown
      urlTransform={(url, key, node) => {
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
