import { createCodePlugin } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

const code = createCodePlugin({
  themes: ["github-light", "github-dark"], // [light, dark]
});

const markdown = "```py\nprint('Hello, world!')\n```";

export default function CustomThemes() {
  return <Streamdown plugins={{ code }}>{markdown}</Streamdown>;
}
