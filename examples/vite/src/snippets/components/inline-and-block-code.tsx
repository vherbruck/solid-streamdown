import type { JSX } from "solid-js";
import { type ExtraProps, Streamdown } from "solid-streamdown";

const MyCodeBlock = (props: JSX.IntrinsicElements["code"] & ExtraProps) => (
  <pre class="overflow-x-auto rounded-md bg-gray-900 p-4 text-gray-100 text-sm">
    <code>{props.children}</code>
  </pre>
);

const markdown = "Inline `code` and a fenced block:\n\n```sh\nbun add solid-streamdown\n```";

export default function Page() {
  return (
    <Streamdown
      components={{
        inlineCode: (props) => (
          <code class="rounded bg-violet-100 px-1 text-sm text-violet-800">{props.children}</code>
        ),
        code: MyCodeBlock,
      }}
    >
      {markdown}
    </Streamdown>
  );
}
