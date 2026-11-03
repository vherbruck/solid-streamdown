import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "../animation/fake-stream";

const reply = "Streaming content with a caret at the end...";

export default function CaretStyles() {
  const stream = createFakeStream(reply);
  return (
    <>
      <Streamdown caret="block" isAnimating={stream.isStreaming()}>
        {stream.content()}
      </Streamdown>
      <Streamdown caret="circle" isAnimating={stream.isStreaming()}>
        {stream.content()}
      </Streamdown>
    </>
  );
}
