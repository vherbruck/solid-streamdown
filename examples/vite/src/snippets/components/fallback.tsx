import type { JSX } from "solid-js";
import { type ExtraProps, Streamdown } from "solid-streamdown";

type TagProps = ExtraProps & { children?: JSX.Element };

// Renders any tag without its own component as a span that records the tag.
// Don't recreate the tag itself with <Dynamic>: unlike React, Solid creates
// real elements, so a <script> made that way would run.
const Fallback = (props: TagProps) => (
  <span data-tag={props.node?.tagName}>{props.children}</span>
);

const markdown = 'Hi <mention user_id="7">Ada</mention>, here is a <chip>new</chip> tag.';

export default function Page() {
  return (
    <Streamdown
      allowedTags={{
        mention: ["user_id"],
        chip: [],
      }}
      components={{
        // Still wins over fallbackComponent for this tag
        mention: (props: { user_id?: string; children?: JSX.Element }) => (
          <span class="font-medium text-blue-600" data-user-id={props.user_id}>
            @{props.children}
          </span>
        ),
      }}
      fallbackComponent={Fallback}
    >
      {markdown}
    </Streamdown>
  );
}
