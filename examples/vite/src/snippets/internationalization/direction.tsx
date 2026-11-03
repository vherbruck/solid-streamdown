import { Streamdown } from "solid-streamdown";

const markdown = `# مرحبا بالعالم

هذه فقرة باللغة العربية.

This paragraph is in English.

\`\`\`js
console.log("code stays left-to-right");
\`\`\``;

export default function MixedDirection() {
  return <Streamdown dir="auto">{markdown}</Streamdown>;
}
