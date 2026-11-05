import { cjk } from "@solid-streamdown/cjk";
import { Streamdown } from "solid-streamdown";

const markdown = "**この文は太字です。**これは普通の文です。";

export default function Page() {
  return <Streamdown plugins={{ cjk }}>{markdown}</Streamdown>;
}
