import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

export default function CharAnimation() {
  const stream = createFakeStream("Each character fades in on its own.");
  return (
    <Streamdown animated={{ animation: "fadeIn", sep: "char" }} isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
