import { type JSX, Show } from "solid-js";
import { defaultComponents, type ExtraProps, Streamdown } from "solid-streamdown";

const DefaultLink = defaultComponents.a;

const Link = (props: JSX.IntrinsicElements["a"] & ExtraProps) => (
  <Show when={props.href?.startsWith("/internal")} fallback={<DefaultLink {...props} />}>
    <a class="text-emerald-600" href={props.href}>
      {props.children}
    </a>
  </Show>
);

const markdown = "An [internal page](/internal/settings) and an [external site](https://example.com).";

export default function Page() {
  return <Streamdown components={{ a: Link }}>{markdown}</Streamdown>;
}
