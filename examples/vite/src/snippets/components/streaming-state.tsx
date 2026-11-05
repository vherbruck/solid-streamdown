import { type JSX, Show } from "solid-js";
import {
  defaultComponents,
  type ExtraProps,
  Streamdown,
  useIsCodeFenceIncomplete,
} from "solid-streamdown";
import { createFakeStream } from "../animation/fake-stream";

const MyCodeBlock = (props: JSX.IntrinsicElements["code"] & ExtraProps) => {
  const isIncomplete = useIsCodeFenceIncomplete();
  return (
    <Show when={!isIncomplete()} fallback={<div class="h-24 animate-pulse rounded bg-muted" />}>
      <pre>
        <code>{props.children}</code>
      </pre>
    </Show>
  );
};

const reply = "Here is the code:\n\n```js\nconst answer = 42;\nconsole.log(answer);\n```\n\nThat's all.";

export default function Page() {
  const stream = createFakeStream(reply);
  return (
    <Streamdown
      // `inlineCode` keeps the built-in inline code; `code` then only sees fenced blocks
      components={{ code: MyCodeBlock, inlineCode: defaultComponents.code }}
      isAnimating={stream.isStreaming()}
    >
      {stream.content()}
    </Streamdown>
  );
}
