import { Streamdown } from "solid-streamdown";

// #region context
import { isWithinCodeBlock, type RemendHandler } from "remend";

const handler: RemendHandler = {
  name: "custom",
  handle: (text) => {
    // Skip processing inside code blocks
    if (isWithinCodeBlock(text, text.length - 1)) {
      return text;
    }
    // Your completion logic here
    return text;
  },
};
// #endregion

export default function ContextUtils() {
  return (
    <Streamdown remend={{ handlers: [handler] }}>
      {"A handler that leaves code blocks alone."}
    </Streamdown>
  );
}
