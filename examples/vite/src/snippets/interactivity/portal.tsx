import { createSignal } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown = `| Plan | Price |
| --- | --- |
| Free | $0 |
| Pro | $20 |`;

export default function ScopedOverlays() {
  const [overlayRoot, setOverlayRoot] = createSignal<HTMLDivElement>();

  return (
    <div class="my-app">
      <div ref={setOverlayRoot} />
      <Streamdown portal={overlayRoot() ?? null}>{markdown}</Streamdown>
    </div>
  );
}
