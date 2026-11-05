import { onCleanup, onMount } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

export default function Reply() {
  const stream = createMarkdownStream();

  // Feed chunks as they arrive (a fetch body, SSE, ...), then end the stream.
  onMount(() => {
    const chunks = ["Streaming ", "**with** ", "solid-streamdown 2.x"];
    const timer = setInterval(() => {
      const chunk = chunks.shift();
      if (chunk) {
        stream.write(chunk);
      } else {
        stream.end();
        clearInterval(timer);
      }
    }, 100);
    onCleanup(() => clearInterval(timer));
  });

  return (
    <Streamdown caret="block" isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
