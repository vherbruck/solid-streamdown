import { createCjkPlugin } from "@solid-streamdown/cjk";
import { Streamdown } from "solid-streamdown";

const cjk = createCjkPlugin();

const markdown = "**中文文本（带括号）。**这句子继续也没问题。";

export default function Page() {
  return (
    <div lang="zh-Hans">
      <Streamdown plugins={{ cjk }}>{markdown}</Streamdown>
    </div>
  );
}
