import { onCleanup } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

const header = "| Step | Status |\n| --- | --- |\n";

export default function StreamingTable() {
  const stream = createMarkdownStream({ initialContent: header });
  let row = 0;
  const timer = setInterval(() => {
    row += 1;
    stream.write(`| Step ${row} | done |\n`);
    if (row === 20) {
      clearInterval(timer);
      stream.end();
    }
  }, 60);
  onCleanup(() => clearInterval(timer));

  return (
    <Streamdown isAnimating={stream.isStreaming()} tableMaxHeight={240}>
      {stream.content()}
    </Streamdown>
  );
}
