import { createSignal } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown = "| Plan | Price |\n| --- | --- |\n| Free | $0 |\n| Pro | $20 |";

export default function Page() {
  const [portal, setPortal] = createSignal<HTMLDivElement | null>(null);

  return (
    <div class="my-app">
      <div ref={setPortal} />
      <Streamdown portal={portal}>{markdown}</Streamdown>
    </div>
  );
}
