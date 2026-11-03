import { defaultComponents, Streamdown } from "solid-streamdown";

const DefaultH1 = defaultComponents.h1;

const markdown = "# Getting started\n\nThe heading keeps its default styles and gains an icon.";

export default function Page() {
  return (
    <Streamdown
      class="custom-markdown"
      components={{
        h1: (props) => (
          <DefaultH1 {...props}>
            <span class="heading-icon">📖</span>
            {props.children}
          </DefaultH1>
        ),
      }}
    >
      {markdown}
    </Streamdown>
  );
}
