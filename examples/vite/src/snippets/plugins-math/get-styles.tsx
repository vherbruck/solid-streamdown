import { math } from "@solid-streamdown/math";

// #region get-styles
const cssPath = math.getStyles?.();
// "katex/dist/katex.min.css"
// #endregion

export default function GetStyles() {
  return (
    <p>
      KaTeX CSS: <code>{cssPath}</code>
    </p>
  );
}
