import "solid-streamdown/styles.css";
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

const reply = "Words **fade in** as they arrive, and the spans go away once the reply is complete.";

export default function Page() {
  const stream = createFakeStream(reply);
  return (
    <Streamdown animated isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
