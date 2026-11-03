import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nconst answer: number = 42;\n```";

export default function Chat() {
  return <Streamdown plugins={{ code }}>{markdown}</Streamdown>;
}
