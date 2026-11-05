import { createSignal } from "solid-js";

export interface MarkdownStreamOptions {
  /** Initial content before streaming begins */
  initialContent?: string | undefined;
}

export interface MarkdownStream {
  /** Append a chunk of markdown text */
  write(chunk: string): void;
  /** Signal that the stream is complete */
  end(): void;
  /** Current accumulated content (reactive signal) */
  content: () => string;
  /** Whether the stream is still active (reactive signal) */
  isStreaming: () => boolean;
  /** Reset the stream for reuse */
  reset(): void;
}

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
