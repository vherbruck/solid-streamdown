import { mermaid } from "@solid-streamdown/mermaid";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

// Smoke-test fixture: hostile content that must stay inert in a real browser,
// with the default pipeline and with sanitize and harden removed.
const hostile = [
  '<img src="x" onerror="window.__sdPwned = 1">',
  "<script>window.__sdPwned = 2</script>",
  "[click](javascript:window.__sdPwned=3)",
  '<a href="javascript:window.__sdPwned=5">raw link</a>',
  '<svg><a href="javascript:window.__sdPwned=6"><text y="20">svg link</text></a></svg>',
  "```mermaid",
  'graph TD; A["<img src=x onerror=window.__sdPwned=4>"]-->B; click A call alert()',
  "```",
].join("\n\n");

export default function Security() {
  return (
    <div>
      <div data-pipeline="default">
        <Streamdown linkSafety={{ enabled: false }} mode="static" plugins={{ mermaid }}>
          {hostile}
        </Streamdown>
      </div>
      <div data-pipeline="raw">
        <Streamdown
          linkSafety={{ enabled: false }}
          mode="static"
          plugins={{ mermaid }}
          rehypePlugins={[defaultRehypePlugins.raw]}
        >
          {hostile}
        </Streamdown>
      </div>
    </div>
  );
}
