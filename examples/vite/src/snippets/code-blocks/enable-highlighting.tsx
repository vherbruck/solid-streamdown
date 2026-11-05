import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

const markdown = `\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\``;

export default function Page() {
  return <Streamdown plugins={{ code }}>{markdown}</Streamdown>;
}
