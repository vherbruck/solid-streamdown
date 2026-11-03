import { createSignal, For, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { Streamdown } from "solid-streamdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const reply = "Only the **last assistant message** gets a caret, and only while it streams.";

export default function Chat() {
  const [messages, setMessages] = createStore<Message[]>([
    { id: "1", role: "user", content: "Which message shows a caret?" },
    { id: "2", role: "assistant", content: "" },
  ]);
  const [isStreaming, setIsStreaming] = createSignal(true);

  // Stand-in for a model: append the reply to the last message word by word.
  const words = reply.match(/\S+\s*/g) ?? [];
  const timer = setInterval(() => {
    const word = words.shift();
    if (word === undefined) {
      clearInterval(timer);
      setIsStreaming(false);
    } else {
      setMessages(messages.length - 1, "content", (content) => content + word);
    }
  }, 40);
  onCleanup(() => clearInterval(timer));

  return (
    <For each={messages}>
      {(message, index) => (
        <Streamdown
          caret={
            message.role === "assistant" && index() === messages.length - 1
              ? "block"
              : undefined
          }
          isAnimating={isStreaming()}
        >
          {message.content}
        </Streamdown>
      )}
    </For>
  );
}
