import remend, { type RemendHandler } from "remend";

// #region before-bold
const preprocessHandler: RemendHandler = {
  name: "preprocess",
  handle: (text) => {
    // Transform content before bold is completed
    return text.replace(/\{\{highlight\}\}/g, "**");
  },
  priority: 25, // Runs before bold (35) and after links (20)
};
// #endregion

// #region after-builtins
const postprocessHandler: RemendHandler = {
  name: "postprocess",
  handle: (text) => {
    // Clean up after all built-in handlers
    return text.trim();
  },
  priority: 150, // Runs after all built-ins
};
// #endregion

const input = "  {{highlight}}bold so far";

export default function HandlerPriority() {
  const output = remend(input, { handlers: [preprocessHandler, postprocessHandler] });
  return (
    <pre class="text-sm">
      {JSON.stringify(input)} → {JSON.stringify(output)}
    </pre>
  );
}
