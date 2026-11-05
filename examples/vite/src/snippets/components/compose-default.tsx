import { defaultComponents, Streamdown } from "solid-streamdown";

const DefaultH2 = defaultComponents.h2;

const markdown = "## Blue, with the default spacing and font";

export default function Page() {
  return (
    <Streamdown
      components={{
        // Composes on top of the built-in component
        h2: (props) => <DefaultH2 {...props} class={`${props.class ?? ""} text-blue-500`} />,
      }}
    >
      {markdown}
    </Streamdown>
  );
}
