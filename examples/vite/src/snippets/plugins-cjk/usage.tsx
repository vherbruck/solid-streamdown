import { cjk } from "@solid-streamdown/cjk";
import { Streamdown } from "solid-streamdown";

const markdown = "**この文は太字になります（括弧付き）。**この文が後に続いても大丈夫です。";

export default function Chat() {
  return (
    <div lang="ja">
      <Streamdown plugins={{ cjk }}>{markdown}</Streamdown>
    </div>
  );
}
