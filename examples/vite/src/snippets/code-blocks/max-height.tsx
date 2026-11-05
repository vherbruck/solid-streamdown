import { Streamdown } from "solid-streamdown";

const markdown = `\`\`\`ts\n${Array.from({ length: 40 }, (_, i) => `const line${i + 1} = ${i + 1};`).join("\n")}\n\`\`\``;

// #region variants
// Custom pixel height
const Short = () => <Streamdown codeBlockMaxHeight={240}>{markdown}</Streamdown>;

// CSS length value
const HalfScreen = () => <Streamdown codeBlockMaxHeight="50vh">{markdown}</Streamdown>;

// Disable the height constraint (Infinity works too)
const Unbounded = () => <Streamdown codeBlockMaxHeight={0}>{markdown}</Streamdown>;
// #endregion

export default function MaxHeight() {
  return (
    <>
      <Short />
      <HalfScreen />
      <Unbounded />
    </>
  );
}
