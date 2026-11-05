import { Streamdown } from "solid-streamdown";

const markdown = "# Scoped heading\n\nOnly this instance gets the `.docs-content` styles.";

export default function Page() {
  return <Streamdown class="docs-content">{markdown}</Streamdown>;
}
