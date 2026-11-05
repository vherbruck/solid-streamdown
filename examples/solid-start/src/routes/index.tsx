import { code } from "@solid-streamdown/code";
import { math } from "@solid-streamdown/math";
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

// Server-rendered, then hydrated: every feature on one page.
const markdown = `# Server-rendered Markdown

Some **bold** text, a [link](https://example.com), and inline \`code\`.

- [x] task done
- [ ] task open

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
graph TD; A-->B
\`\`\`

Text with ![an image](/favicon.svg) beside it.
`;

export default function Home() {
  return (
    <main class="mx-auto max-w-3xl p-6">
      <Streamdown mode="static" plugins={{ code, math, mermaid }}>
        {markdown}
      </Streamdown>
    </main>
  );
}
