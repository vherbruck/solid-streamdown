import "katex/dist/katex.min.css";
import { createMathPlugin } from "@solid-streamdown/math";
import { Streamdown } from "solid-streamdown";

const math = createMathPlugin({
  errorColor: "#dc2626",
});

const markdown = "Valid: $$E = mc^2$$. Invalid: $$\\frac{1}{$$.";

export default function ErrorColor() {
  return <Streamdown plugins={{ math }}>{markdown}</Streamdown>;
}
