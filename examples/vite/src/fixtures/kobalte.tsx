import { code } from "@solid-streamdown/code";
import { kobalteUi } from "@solid-streamdown/kobalte";
import { Streamdown } from "solid-streamdown";

// Smoke-test fixture: every control through the Kobalte primitives.
const markdown = [
  "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |",
  "```ts\nconst answer = 42;\n```",
  "[docs](https://example.com)",
].join("\n\n");

export default function Kobalte() {
  return (
    <Streamdown mode="static" plugins={{ code }} ui={kobalteUi}>
      {markdown}
    </Streamdown>
  );
}
