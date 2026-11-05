import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nconst greeting: string = \"hello\";\n```";

export default function Page() {
  return (
    <Streamdown plugins={{ code }} shikiTheme={["github-light", "github-dark"]}>
      {markdown}
    </Streamdown>
  );
}
