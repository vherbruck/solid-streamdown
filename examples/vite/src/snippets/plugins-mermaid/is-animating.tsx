import { mermaid } from "@solid-streamdown/mermaid";
import { onCleanup } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

const chunks = ["```mermaid\n", "graph LR\n", "    A[Chunk] --> B[Chunk]\n", "    B --> C[Done]\n", "```"];

export default function IsAnimating() {
  const stream = createMarkdownStream();
  let next = 0;
  const timer = setInterval(() => {
    if (next < chunks.length) {
      stream.write(chunks[next++] as string);
    } else {
      stream.end();
      clearInterval(timer);
    }
  }, 300);
  onCleanup(() => clearInterval(timer));

  return (
    <Streamdown isAnimating={stream.isStreaming()} plugins={{ mermaid }}>
      {stream.content()}
    </Streamdown>
  );
}
