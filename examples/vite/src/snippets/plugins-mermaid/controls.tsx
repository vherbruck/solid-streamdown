import { mermaid } from "@solid-streamdown/mermaid";
import { createSignal, For } from "solid-js";
import { type ControlsConfig, Streamdown } from "solid-streamdown";

// #region custom
const customControls: ControlsConfig = {
  mermaid: {
    fullscreen: true,
    download: { filename: "flowchart" }, // flowchart.svg / flowchart.png / flowchart.mmd
    copy: true, // or { onCopy, onError } for callbacks
    panZoom: true, // Enable pan and zoom controls
  },
};
// #endregion

// #region partial
const partialControls: ControlsConfig = {
  mermaid: {
    fullscreen: true,
    download: false, // Hide download button
    copy: false, // Hide copy button
    panZoom: false, // Hide pan/zoom controls
  },
};
// #endregion

// #region none
const noMermaidControls: ControlsConfig = { mermaid: false };
// #endregion

const variants = {
  custom: customControls,
  partial: partialControls,
  none: noMermaidControls,
};

const markdown = "```mermaid\ngraph LR\n    A[Show] --> B[Hide]\n```";

export default function Controls() {
  const [variant, setVariant] = createSignal<keyof typeof variants>("custom");

  return (
    <>
      <div class="flex gap-2">
        <For each={Object.keys(variants) as (keyof typeof variants)[]}>
          {(name) => (
            <button
              class="rounded border px-2 py-1 text-sm"
              classList={{ "bg-muted": variant() === name }}
              onClick={() => setVariant(name)}
              type="button"
            >
              {name}
            </button>
          )}
        </For>
      </div>
      <Streamdown controls={variants[variant()]} plugins={{ mermaid }}>
        {markdown}
      </Streamdown>
    </>
  );
}
