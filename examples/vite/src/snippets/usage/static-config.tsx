import { code } from "@solid-streamdown/code";
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const content = "```mermaid\ngraph TD\n  Draft --> Published\n```";

export default function Page() {
  return (
    <Streamdown
      mode="static"
      plugins={{ code, mermaid }}
      shikiTheme={["github-light", "github-dark"]}
      mermaid={{ config: { theme: "neutral" } }}
    >
      {content}
    </Streamdown>
  );
}
