import { Streamdown } from "solid-streamdown";

const markdown = "A [partial link and $$x^";

export default function Page() {
  return (
    <Streamdown
      isAnimating
      remend={{
        links: false, // Disable link completion
        katex: false, // Disable KaTeX completion
      }}
    >
      {markdown}
    </Streamdown>
  );
}
