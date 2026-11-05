import "katex/dist/katex.min.css";
import { math } from "@solid-streamdown/math";
import { Streamdown } from "solid-streamdown";

// #region escaping
// Wrong: "\f" is a form feed escape, so KaTeX receives "rac{1}{2}"
// const markdown = "$$\frac{1}{2}$$";

// Correct: escape the backslash
const markdown = "$$\\frac{1}{2}$$";

// Also correct: String.raw keeps backslashes as written
const raw = String.raw`$$\frac{1}{2}$$`;
// #endregion

export default function Escaping() {
  return <Streamdown plugins={{ math }}>{`${markdown} and ${raw}`}</Streamdown>;
}
