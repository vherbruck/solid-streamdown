import "katex/dist/katex.min.css";
import { math } from "@solid-streamdown/math";
import { Streamdown } from "solid-streamdown";

const markdown = "The quadratic formula is $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$.";

export default function Chat() {
  return <Streamdown plugins={{ math }}>{markdown}</Streamdown>;
}
