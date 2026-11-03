import { For } from "solid-js";
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

const reply = "The same reply, revealed with each of the three built-in animations.";
const animations = ["fadeIn", "blurIn", "slideUp"] as const;

export default function AnimationTypes() {
  const stream = createFakeStream(reply);
  return (
    <For each={animations}>
      {(animation) => (
        <Streamdown animated={{ animation }} isAnimating={stream.isStreaming()}>
          {stream.content()}
        </Streamdown>
      )}
    </For>
  );
}
