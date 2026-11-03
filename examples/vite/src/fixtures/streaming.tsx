import { onCleanup, onMount } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

// Smoke-test fixture: a reply streamed token by token with animation.
const reply = "Streamed **reply** with several words arriving one by one.\n\n- first\n- second\n";

export default function Streaming() {
  const stream = createMarkdownStream();
  onMount(() => {
    const tokens = reply.match(/\S+\s*/g) ?? [];
    let index = 0;
    const timer = setInterval(() => {
      if (index < tokens.length) {
        stream.write(tokens[index++] as string);
      } else {
        stream.end();
        clearInterval(timer);
      }
    }, 20);
    onCleanup(() => clearInterval(timer));
  });
  return (
    <Streamdown animated caret="block" isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
