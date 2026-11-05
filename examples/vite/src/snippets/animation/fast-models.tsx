import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

const reply =
  "Fast models deliver many tokens per update. A slightly longer blur hides how they arrive in batches.";

export default function FastModels() {
  const stream = createFakeStream(reply, 15);
  return (
    <Streamdown
      animated={{
        animation: "blurIn",
        duration: 250,
        easing: "ease-out",
      }}
      isAnimating={stream.isStreaming()}
    >
      {stream.content()}
    </Streamdown>
  );
}
