import { Streamdown } from "solid-streamdown";

const markdown = "Classes on the container apply to the root `<div>`.";

export default function Page() {
  return <Streamdown class="mx-auto max-w-prose text-base">{markdown}</Streamdown>;
}
