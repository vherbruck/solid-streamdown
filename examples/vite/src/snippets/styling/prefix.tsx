import { Streamdown } from "solid-streamdown";

const markdown = "Every utility class is written as `tw:flex`, `tw:items-center` and so on.";

export default function Page() {
  return <Streamdown prefix="tw">{markdown}</Streamdown>;
}
