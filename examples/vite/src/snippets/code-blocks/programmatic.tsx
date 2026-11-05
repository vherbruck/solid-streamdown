// #region types
import type { CodeHighlighterPlugin, HighlightOptions, HighlightResult } from "@solid-streamdown/code";
// #endregion
import { code } from "@solid-streamdown/code";
import { createSignal, For } from "solid-js";

export default function ProgrammaticHighlight() {
  const [result, setResult] = createSignal<HighlightResult | null>(null);

  // #region highlight
  const options: HighlightOptions = {
    code: "const x = 1;",
    language: "typescript",
    themes: ["github-light", "github-dark"],
  };

  if (code.supportsLanguage("typescript")) {
    // Returns the tokens at once when cached; otherwise null, and the
    // callback receives them once the grammar has loaded.
    const cached = code.highlight(options, (tokens) => setResult(tokens));
    if (cached) {
      setResult(cached);
    }
  }
  // #endregion

  return (
    <pre>
      <For each={result()?.tokens}>
        {(line) => (
          <div>
            <For each={line}>{(token) => <span style={token.htmlStyle}>{token.content}</span>}</For>
          </div>
        )}
      </For>
    </pre>
  );
}
