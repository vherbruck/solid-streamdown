import { createSignal, type JSX } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown =
  'According to the documentation <source id="abc">Getting Started Guide</source>, you should...';

export default function Page() {
  const [selected, setSelected] = createSignal<string>();
  return (
    <>
      <Streamdown
        allowedTags={{
          source: ["id"], // Allow <source> tag with id attribute
        }}
        components={{
          source: (props: { id?: string; children?: JSX.Element }) => (
            <button
              class="cursor-pointer text-blue-600 underline"
              onClick={() => setSelected(props.id)}
              type="button"
            >
              {props.children}
            </button>
          ),
        }}
      >
        {markdown}
      </Streamdown>
      <p class="text-muted-foreground text-sm">Selected source: {selected() ?? "none"}</p>
    </>
  );
}
