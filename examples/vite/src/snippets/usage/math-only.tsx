import { math } from "@solid-streamdown/math";
import { Streamdown } from "solid-streamdown";
import "katex/dist/katex.min.css";

const markdown = "The famous $$E = mc^2$$";

export default function Page() {
  return <Streamdown plugins={{ math }}>{markdown}</Streamdown>;
}
