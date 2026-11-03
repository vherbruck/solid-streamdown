import { Streamdown } from "solid-streamdown";

const markdown = "This is **incomplete bold";

export default function Page() {
  return <Streamdown parseIncompleteMarkdown={false}>{markdown}</Streamdown>;
}
