import { Streamdown } from "solid-streamdown";

export default function Page() {
  const markdown = "# Hello World\n\nThis is **streaming** markdown!";

  return <Streamdown>{markdown}</Streamdown>;
}
