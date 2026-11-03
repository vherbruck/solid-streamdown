import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

// Only for Markdown you wrote yourself: without sanitize, any HTML element
// and attribute passes, apart from what the render guard drops.
const markdown = "<details><summary>Release notes</summary>Written by our team.</details>";

export default function TrustedHtml() {
  return (
    <Streamdown rehypePlugins={[defaultRehypePlugins.raw, defaultRehypePlugins.harden]}>
      {markdown}
    </Streamdown>
  );
}
