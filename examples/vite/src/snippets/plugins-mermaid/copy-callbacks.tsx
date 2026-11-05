import { mermaid } from "@solid-streamdown/mermaid";
import { createSignal } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown = "```mermaid\ngraph LR\n    A[Copy] --> B[Paste]\n```";

export default function CopyCallbacks() {
  const [status, setStatus] = createSignal("");

  return (
    <>
      <Streamdown
        controls={{
          mermaid: {
            copy: {
              onCopy: () => setStatus("Diagram copied"),
              onError: (error) => setStatus(error.message),
            },
          },
        }}
        plugins={{ mermaid }}
      >
        {markdown}
      </Streamdown>
      <p class="text-muted-foreground text-sm">{status()}</p>
    </>
  );
}
