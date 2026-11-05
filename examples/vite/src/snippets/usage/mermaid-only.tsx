import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const markdown = "```mermaid\ngraph LR\n  A --> B\n```";

export default function Page() {
  return <Streamdown plugins={{ mermaid }}>{markdown}</Streamdown>;
}
