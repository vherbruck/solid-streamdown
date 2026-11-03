import { Block, type BlockProps, Streamdown } from "solid-streamdown";
import { createFakeStream } from "../animation/fake-stream";

// Props are reactive: read them where they are used, don't destructure them.
const OutlinedBlock = (props: BlockProps) => (
  <div class="rounded-md border border-border p-2" data-block-index={props.index}>
    <Block {...props} />
  </div>
);

const reply = "First block.\n\nSecond block, still growing while it streams.";

export default function BlockComponentExample() {
  const stream = createFakeStream(reply);
  return (
    <Streamdown BlockComponent={OutlinedBlock} isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
