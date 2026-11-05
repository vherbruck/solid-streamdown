import { code } from "@solid-streamdown/code";
import { math } from "@solid-streamdown/math";
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

// Smoke-test fixture: every feature, rendered statically.
const markdown = `A [link](https://example.com) and a table:

| Name | Value |
| --- | --- |
| Alpha | 1 |

\`\`\`ts
const answer: number = 42;
\`\`\`

$$
\\frac{1}{2} + \\sqrt{x}
$$

\`\`\`mermaid
graph TD; Start-->Finish
\`\`\`
`;

export default function Features() {
  return (
    <Streamdown mode="static" plugins={{ code, math, mermaid }}>
      {markdown}
    </Streamdown>
  );
}
