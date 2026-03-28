import { createMemo, For, type Component } from "solid-js";
import type { StreamMarkdownProps } from "./types";
import { parseMarkdown } from "./parser";
import { parseMarkdownIntoBlocks } from "./utils/parse-blocks";

export const StreamMarkdown: Component<StreamMarkdownProps> = (props) => {
  const markdown = createMemo(() => {
    if (props.stream) {
      return props.stream.content();
    }
    return props.content ?? "";
  });

  const isStreaming = createMemo(() => {
    return props.stream?.isStreaming() ?? false;
  });

  // Split into blocks for incremental rendering.
  // During streaming, only the last block changes — previous blocks
  // keep stable identity and avoid re-rendering.
  const blocks = createMemo(() => {
    return parseMarkdownIntoBlocks(markdown());
  });

  // Cache rendered blocks. Only the last block re-parses during streaming.
  const blockCache = new Map<string, any>();

  const renderBlock = (block: string, index: number) => {
    const isLastBlock = index === blocks().length - 1;
    const isActive = isStreaming() && isLastBlock;

    // Use cache for stable (non-active) blocks
    if (!isActive && blockCache.has(block)) {
      return blockCache.get(block);
    }

    const rendered = parseMarkdown(block, {
      components: props.components,
      isStreaming: isActive,
    });

    if (!isActive) {
      blockCache.set(block, rendered);
    }

    return rendered;
  };

  return (
    <div
      class={props.class}
      classList={{
        "streamdown": true,
        "streamdown-streaming": isStreaming(),
        "streamdown-caret": isStreaming() && (props.showCaret ?? true),
      }}
    >
      <For each={blocks()}>
        {(block, index) => (
          <div class="streamdown-block">
            {renderBlock(block, index())}
          </div>
        )}
      </For>
    </div>
  );
};
