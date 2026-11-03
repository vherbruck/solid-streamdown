import type { RemendHandler } from "remend";
import { Streamdown } from "solid-streamdown";

const jokeHandler: RemendHandler = {
  name: "joke",
  handle: (text) => {
    // Complete {{joke}} marks that aren't closed
    const match = text.match(/\{\{joke\}\}([^{]*)$/);
    if (match && !text.endsWith("{{/joke}}")) {
      return `${text}{{/joke}}`;
    }
    return text;
  },
  priority: 80, // Runs after most built-ins (0 to 75)
};

export default function Page() {
  return (
    <Streamdown remend={{ handlers: [jokeHandler] }}>
      {"Here is one: {{joke}}Why did the parser stop?"}
    </Streamdown>
  );
}
