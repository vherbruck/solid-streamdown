import { type JSX, Show } from "solid-js";
import { defaultComponents, type ExtraProps, Streamdown } from "solid-streamdown";

const DefaultLink = defaultComponents.a;

const Link = (props: JSX.IntrinsicElements["a"] & ExtraProps) => (
  <Show
    when={props.href !== "streamdown:incomplete-link"}
    fallback={<span class="text-muted-foreground">{props.children}</span>}
  >
    <DefaultLink {...props} />
  </Show>
);

const markdown = "A [finished link](https://example.com) and an [unfinished one](https://exa";

export default function IncompleteLinks() {
  return <Streamdown components={{ a: Link }}>{markdown}</Streamdown>;
}
