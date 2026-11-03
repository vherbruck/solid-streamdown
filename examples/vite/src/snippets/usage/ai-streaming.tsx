import { code } from "@solid-streamdown/code";
import { mermaid } from "@solid-streamdown/mermaid";
import { createSignal, For } from "solid-js";
import { createMarkdownStream, type MarkdownStream, Streamdown } from "solid-streamdown";

type Message = { role: "user" | "assistant"; stream: MarkdownStream };

const settled = (role: Message["role"], text: string): Message => {
  const stream = createMarkdownStream({ initialContent: text });
  stream.end();
  return { role, stream };
};

export default function Chat() {
  const [messages, setMessages] = createSignal([settled("assistant", "Ask me **anything**.")]);
  const [input, setInput] = createSignal("");
  const isLoading = () => messages().at(-1)?.stream.isStreaming() ?? false;

  const send = async (event: SubmitEvent) => {
    event.preventDefault();
    const prompt = input().trim();
    if (!prompt) return;
    const reply = createMarkdownStream();
    setMessages((list) => [...list, settled("user", prompt), { role: "assistant", stream: reply }]);
    setInput("");
    try {
      // An endpoint that returns `streamText(...).toTextStreamResponse()`
      const response = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ prompt }) });
      const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        reply.write(chunk.value);
      }
    } finally {
      reply.end();
    }
  };

  return (
    <div class="flex flex-col">
      <div class="space-y-4 p-4">
        <For each={messages()}>
          {(message) => (
            <div class={message.role === "user" ? "text-right" : "text-left"}>
              <div class="inline-block max-w-2xl">
                <Streamdown plugins={{ code, mermaid }} isAnimating={message.stream.isStreaming()}>
                  {message.stream.content()}
                </Streamdown>
              </div>
            </div>
          )}
        </For>
      </div>

      <form onSubmit={send} class="border-t p-4">
        <input
          value={input()}
          onInput={(event) => setInput(event.currentTarget.value)}
          placeholder="Ask me anything..."
          class="w-full rounded-lg border px-4 py-2"
          disabled={isLoading()}
        />
      </form>
    </div>
  );
}
