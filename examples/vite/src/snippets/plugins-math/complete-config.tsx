import "katex/dist/katex.min.css";
import { createMathPlugin } from "@solid-streamdown/math";
import { Streamdown } from "solid-streamdown";

const math = createMathPlugin({
  singleDollarTextMath: true, // Enable $...$ syntax (default: false)
  errorColor: "#dc2626", // Custom error color (default: "var(--color-muted-foreground)")
});

const markdown = "Single dollars now delimit math: $a^2 + b^2 = c^2$.";

export default function CompleteConfig() {
  return <Streamdown plugins={{ math }}>{markdown}</Streamdown>;
}
