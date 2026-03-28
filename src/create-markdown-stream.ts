import { createSignal } from "solid-js";
import type { MarkdownStream, MarkdownStreamOptions } from "./types";

export function createMarkdownStream(
  options?: MarkdownStreamOptions,
): MarkdownStream {
  const [content, setContent] = createSignal(options?.initialContent ?? "");
  const [isStreaming, setIsStreaming] = createSignal(true);

  return {
    write(chunk: string) {
      setContent((prev) => prev + chunk);
    },
    end() {
      setIsStreaming(false);
    },
    content,
    isStreaming,
    reset() {
      setContent(options?.initialContent ?? "");
      setIsStreaming(true);
    },
  };
}
