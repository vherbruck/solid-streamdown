import { mermaid } from "@solid-streamdown/mermaid";
import type { Component } from "solid-js";
import { type MermaidErrorComponentProps, Streamdown } from "solid-streamdown";

const CustomMermaidError: Component<MermaidErrorComponentProps> = (props) => (
  <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
    <p class="font-semibold text-amber-900">Couldn't render diagram</p>
    <p class="mt-2 text-amber-700 text-sm">
      There was an issue with the diagram syntax.
    </p>
    <button
      class="mt-3 rounded bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700"
      onClick={() => props.retry()}
      type="button"
    >
      Try Again
    </button>
  </div>
);

const markdown = "```mermaid\ngraph TD\n    A[Parse] --> B[Render]\n```";

export default function Page() {
  return (
    <Streamdown
      mermaid={{ errorComponent: CustomMermaidError }}
      plugins={{ mermaid }}
    >
      {markdown}
    </Streamdown>
  );
}
