import { createSignal, For, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { Streamdown } from "solid-streamdown";

interface Message {
  id: string;
  text: string;
}

const reply = `## Settled blocks stay put

This paragraph is finished once the next one starts.

- New tokens only touch the **last** block
- Earlier blocks are never parsed or rendered again
`;

export default function Chat() {
  const [messages, setMessages] = createStore<Message[]>([{ id: "1", text: "" }]);
  const [isStreaming, setIsStreaming] = createSignal(true);

  // Stand-in for a model: append to the last message as chunks arrive.
  const chunks = reply.match(/\S+\s*/g) ?? [];
  const timer = setInterval(() => {
    const chunk = chunks.shift();
    if (chunk === undefined) {
      clearInterval(timer);
      setIsStreaming(false);
    } else {
      setMessages(messages.length - 1, "text", (text) => text + chunk);
    }
  }, 40);
  onCleanup(() => clearInterval(timer));

  return (
    <For each={messages}>
      {(message) => <Streamdown isAnimating={isStreaming()}>{message.text}</Streamdown>}
    </For>
  );
}
