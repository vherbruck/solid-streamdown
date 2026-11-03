import { onCleanup } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

/**
 * Writes `text` into a markdown stream one word at a time, standing in for a
 * model's reply. Call it inside a component: the timer stops on cleanup.
 */
export const createFakeStream = (text: string, interval = 40) => {
  const stream = createMarkdownStream();
  const words = text.match(/\S+\s*/g) ?? [];
  let index = 0;
  const timer = setInterval(() => {
    const word = words[index++];
    if (word === undefined) {
      clearInterval(timer);
      stream.end();
    } else {
      stream.write(word);
    }
  }, interval);
  onCleanup(() => clearInterval(timer));
  return stream;
};

export default function FakeStream() {
  const stream = createFakeStream("A reply that arrives **one word** at a time.");
  return <Streamdown isAnimating={stream.isStreaming()}>{stream.content()}</Streamdown>;
}
