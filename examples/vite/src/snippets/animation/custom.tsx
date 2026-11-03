import "./custom.css";
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

export default function CustomAnimation() {
  const stream = createFakeStream("Words scale up into place with a custom keyframe.");
  return (
    <Streamdown animated={{ animation: "myCustomAnimation" }} isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
