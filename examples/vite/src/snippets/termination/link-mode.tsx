import { Streamdown } from "solid-streamdown";

// A reply cut off in the middle of a link's URL.
const markdown = "Read the [Click here](https://exampl";

export default function TextOnlyLinks() {
  return <Streamdown remend={{ linkMode: "text-only" }}>{markdown}</Streamdown>;
}
