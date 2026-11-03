import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nconst greeting = 'こんにちは';\n```";

export default function JapaneseLabels() {
  // Only override what you need; everything else stays English.
  return <Streamdown translations={{ copyCode: "コピー", close: "閉じる" }}>{markdown}</Streamdown>;
}
