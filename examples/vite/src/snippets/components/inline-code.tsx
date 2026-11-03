import { Streamdown } from "solid-streamdown";

const markdown = "Call `render()` once.\n\n```ts\nrender(() => <App />, root);\n```";

export default function Page() {
  return (
    <Streamdown
      components={{
        inlineCode: (props) => (
          <code class="rounded bg-violet-100 px-1.5 py-0.5 text-sm text-violet-800">
            {props.children}
          </code>
        ),
      }}
    >
      {markdown}
    </Streamdown>
  );
}
