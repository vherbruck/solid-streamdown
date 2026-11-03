import type { JSX } from "solid-js";
import { Streamdown } from "solid-streamdown";

interface SourceProps {
  id?: string;
  children?: JSX.Element;
}

interface MentionProps {
  user_id?: string;
  type?: string;
  children?: JSX.Element;
}

interface ActionProps {
  name?: string;
  payload?: string;
  children?: JSX.Element;
}

const markdown = `See <source id="doc-1">the guide</source>, ask <mention user_id="42" type="user">Ada</mention>, or <action name="retry" payload="{}">try again</action>.`;

export default function Page() {
  return (
    <Streamdown
      allowedTags={{
        source: ["id"],
        mention: ["user_id", "type"],
        action: ["name", "payload"],
      }}
      components={{
        source: (props: SourceProps) => (
          <span class="rounded bg-muted px-1 text-sm" data-source-id={props.id}>
            {props.children}
          </span>
        ),
        mention: (props: MentionProps) => (
          <span class="font-medium text-blue-600" data-user-id={props.user_id}>
            @{props.children}
          </span>
        ),
        action: (props: ActionProps) => (
          <button class="rounded border border-border px-1 text-sm" data-action={props.name} type="button">
            {props.children}
          </button>
        ),
      }}
    >
      {markdown}
    </Streamdown>
  );
}
