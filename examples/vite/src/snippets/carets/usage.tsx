import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "../animation/fake-stream";

const reply = "The caret sits at the end of the text while the reply is still streaming.";

export default function StreamingChat() {
  const stream = createFakeStream(reply);
  return (
    <Streamdown caret="block" isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
