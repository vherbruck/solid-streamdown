import { mermaid } from "@solid-streamdown/mermaid";
import { createSignal } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown = "```mermaid\ngraph LR\n  A[Draft] --> B[Review] --> C[Publish]\n```";

// #region copy-callbacks
const DiagramWithCopyStatus = () => {
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
      <p role="status">{status()}</p>
    </>
  );
};
// #endregion

// #region download-filename
// Downloads flowchart.svg, flowchart.png or flowchart.mmd
const NamedDiagram = () => (
  <Streamdown controls={{ mermaid: { download: { filename: "flowchart" } } }} plugins={{ mermaid }}>
    {markdown}
  </Streamdown>
);
// #endregion

// #region pan-zoom
// Pan and zoom are on by default; this diagram turns them off.
const FixedDiagram = () => (
  <Streamdown controls={{ mermaid: { panZoom: false } }} plugins={{ mermaid }}>
    {markdown}
  </Streamdown>
);
// #endregion

export default function MermaidControls() {
  return (
    <>
      <DiagramWithCopyStatus />
      <NamedDiagram />
      <FixedDiagram />
    </>
  );
}
