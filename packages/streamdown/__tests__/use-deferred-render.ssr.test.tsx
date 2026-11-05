import { Show } from "solid-js";
import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { createDeferredRender } from "../hooks/use-deferred-render";

const Probe = (props: { immediate?: boolean }) => {
  const { shouldRender } = createDeferredRender(props);
  return (
    <Show fallback={<i>later</i>} when={shouldRender()}>
      <b>now</b>
    </Show>
  );
};

it("defers on the server unless immediate", () => {
  expect(renderToString(() => <Probe />)).toContain("later");
  expect(renderToString(() => <Probe immediate />)).toContain("now");
});
