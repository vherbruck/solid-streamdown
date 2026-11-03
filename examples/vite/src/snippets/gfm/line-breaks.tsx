import remarkBreaks from "remark-breaks";
import { defaultRemarkPlugins, Streamdown } from "solid-streamdown";

const remarkPlugins = [...Object.values(defaultRemarkPlugins), remarkBreaks];

const markdown = "This is line one\nThis is line two\nThis is line three";

export default function LineBreaks() {
  return <Streamdown remarkPlugins={remarkPlugins}>{markdown}</Streamdown>;
}
