import { Streamdown } from "solid-streamdown";

const markdown = "# A custom heading\n\n## A custom subheading\n\nA paragraph with custom styles.";

export default function Page() {
  return (
    <Streamdown
      components={{
        h1: (props) => <h1 class="font-bold text-4xl text-blue-600">{props.children}</h1>,
        h2: (props) => <h2 class="font-semibold text-3xl text-blue-500">{props.children}</h2>,
        p: (props) => <p class="text-gray-700 leading-relaxed">{props.children}</p>,
      }}
    >
      {markdown}
    </Streamdown>
  );
}
