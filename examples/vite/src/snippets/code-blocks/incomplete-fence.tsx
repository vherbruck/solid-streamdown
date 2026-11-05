import { type JSX, onCleanup, Show } from "solid-js";
import { createMarkdownStream, Streamdown, useIsCodeFenceIncomplete } from "solid-streamdown";

// #region component
const MyCodeBlock = (props: { children?: JSX.Element }) => {
  // An accessor: call it to read the current value.
  const isIncomplete = useIsCodeFenceIncomplete();

  return (
    <Show when={!isIncomplete()} fallback={<div class="h-24 animate-pulse rounded bg-muted" />}>
      <pre>
        <code>{props.children}</code>
      </pre>
    </Show>
  );
};
// #endregion

const response = "```text\nline one\nline two\nline three\n```\n\nDone.";

export default function IncompleteFence() {
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
    <Streamdown components={{ code: MyCodeBlock }} isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
