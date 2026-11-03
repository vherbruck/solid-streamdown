import type { JSX } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown = 'Ping <mention user_id="123">some_user_name</mention> about it.';

export default function Page() {
  return (
    <Streamdown
      allowedTags={{
        mention: ["user_id"],
      }}
      components={{
        mention: (props: { user_id?: string; children?: JSX.Element }) => (
          <span class="text-blue-600">@{props.children}</span>
        ),
      }}
      literalTagContent={["mention"]}
    >
      {markdown}
    </Streamdown>
  );
}
