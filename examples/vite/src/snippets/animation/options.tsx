import "solid-streamdown/styles.css";
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

const reply = "A configured reveal: blurred words that sharpen over 200 milliseconds.";

export default function Page() {
  const stream = createFakeStream(reply);
  return (
    <Streamdown
      animated={{
        animation: "blurIn", // "fadeIn" | "blurIn" | "slideUp" | custom string
        duration: 200, // milliseconds (default: 150)
        easing: "ease-out", // CSS timing function (default: "ease")
        sep: "word", // "word" | "char" (default: "word")
      }}
      isAnimating={stream.isStreaming()}
    >
      {stream.content()}
    </Streamdown>
  );
}
