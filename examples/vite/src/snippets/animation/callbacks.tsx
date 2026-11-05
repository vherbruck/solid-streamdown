import { createSignal } from "solid-js";
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

export default function Callbacks() {
  const stream = createFakeStream("Watch the status line below change when the reply ends.");
  const [status, setStatus] = createSignal("idle");
  return (
    <>
      <Streamdown
        animated
        isAnimating={stream.isStreaming()}
        onAnimationEnd={() => setStatus("ended")}
        onAnimationStart={() => setStatus("streaming")}
      >
        {stream.content()}
      </Streamdown>
      <p class="text-muted-foreground text-sm">Status: {status()}</p>
    </>
  );
}
