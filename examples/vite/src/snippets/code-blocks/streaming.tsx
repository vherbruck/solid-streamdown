import { code } from "@solid-streamdown/code";
import { onCleanup } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

const response = `Here is a loop:

\`\`\`ts
for (let i = 0; i < 3; i++) {
  console.log(i);
}
\`\`\`
`;

export default function StreamingCode() {
  const stream = createMarkdownStream();

  // Simulate a model writing a few characters at a time.
  let offset = 0;
  const timer = setInterval(() => {
    stream.write(response.slice(offset, offset + 4));
    offset += 4;
    if (offset >= response.length) {
      clearInterval(timer);
      stream.end();
    }
  }, 50);
  onCleanup(() => clearInterval(timer));

  return (
    <Streamdown codeBlockMaxHeight={320} isAnimating={stream.isStreaming()} plugins={{ code }}>
      {stream.content()}
    </Streamdown>
  );
}
