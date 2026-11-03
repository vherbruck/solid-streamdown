import { Streamdown } from "solid-streamdown";

const markdown = "Read the [Solid docs](https://docs.solidjs.com).";

export default function Chat() {
  return <Streamdown linkSafety={{ enabled: false }}>{markdown}</Streamdown>;
}
