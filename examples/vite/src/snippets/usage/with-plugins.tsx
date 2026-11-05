import { cjk } from "@solid-streamdown/cjk";
import { code } from "@solid-streamdown/code";
import { math } from "@solid-streamdown/math";
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

// KaTeX styles for math rendering
import "katex/dist/katex.min.css";

const markdown = `
# Hello World

Here's some code:

\`\`\`typescript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

And a diagram:

\`\`\`mermaid
graph LR
    A[Start] --> B[End]
\`\`\`

And some math: $$E = mc^2$$
`;

export default function Page() {
  return <Streamdown plugins={{ code, mermaid, math, cjk }}>{markdown}</Streamdown>;
}
