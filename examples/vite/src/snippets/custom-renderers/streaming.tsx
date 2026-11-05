import { onCleanup, Show } from "solid-js";
import { createMarkdownStream, type CustomRendererProps, Streamdown } from "solid-streamdown";

// #region renderer
const MyRenderer = (props: CustomRendererProps) => (
  <Show
    when={!props.isIncomplete}
    fallback={
      <div class="flex h-48 items-center justify-center rounded-md bg-muted">
        <span class="text-muted-foreground text-sm">Loading...</span>
      </div>
    }
  >
    <pre class="rounded-md border p-4 text-sm">{props.code}</pre>
  </Show>
);
// #endregion

const response = "```my-data\nalpha: 1\nbeta: 2\ngamma: 3\n```\n";

export default function StreamingRenderer() {
  const stream = createMarkdownStream();
  let offset = 0;
  const timer = setInterval(() => {
    stream.write(response.slice(offset, offset + 3));
    offset += 3;
    if (offset >= response.length) {
      clearInterval(timer);
      stream.end();
    }
  }, 60);
  onCleanup(() => clearInterval(timer));

  return (
    <Streamdown
      isAnimating={stream.isStreaming()}
      plugins={{ renderers: [{ language: "my-data", component: MyRenderer }] }}
    >
      {stream.content()}
    </Streamdown>
  );
}
