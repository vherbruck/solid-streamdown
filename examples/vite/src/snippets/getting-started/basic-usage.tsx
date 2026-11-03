import { Streamdown } from "solid-streamdown";

const markdown = "# Hello World\n\nThis is **streaming** markdown!";

export default function App() {
  return <Streamdown>{markdown}</Streamdown>;
}
