import { onCleanup, onMount } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

const reply = "## Streaming\n\nThis reply arrives **token by token**, as an AI response would.\n\n- one\n- two\n- three\n";

// Streams on the client after hydration; the server renders it empty.
export default function Stream() {
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
    }, 30);
    onCleanup(() => clearInterval(timer));
  });
  return (
    <main class="mx-auto max-w-3xl p-6">
      <Streamdown animated caret="block" isAnimating={stream.isStreaming()}>
        {stream.content()}
      </Streamdown>
    </main>
  );
}
