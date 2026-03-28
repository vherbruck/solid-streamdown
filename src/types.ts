import type { Component, JSX } from "solid-js";

/** Override default HTML element renderers */
export type ComponentOverrides = Partial<{
  [K in keyof JSX.IntrinsicElements]: Component<JSX.IntrinsicElements[K]>;
}> &
  Record<string, Component<Record<string, unknown>>>;

export interface MarkdownStreamOptions {
  /** Initial content before streaming begins */
  initialContent?: string;
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

export interface StreamMarkdownProps {
  /** Static markdown content */
  content?: string;
  /** Streaming markdown source */
  stream?: MarkdownStream;
  /** Custom component overrides for rendered elements */
  components?: ComponentOverrides;
  /** CSS class applied to the wrapper element */
  class?: string;
  /** Show caret animation while streaming (default: true) */
  showCaret?: boolean;
}
