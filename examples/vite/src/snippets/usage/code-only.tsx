import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nconst answer = 42;\n```";

export default function Page() {
  return <Streamdown plugins={{ code }}>{markdown}</Streamdown>;
}
