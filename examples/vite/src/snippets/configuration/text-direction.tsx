import { Streamdown } from "solid-streamdown";

const markdown = `# Hello

This paragraph is English.

این پاراگراف فارسی است و از راست به چپ خوانده می‌شود.
`;

export default function Page() {
  return (
    <Streamdown dir="auto" mode="static">
      {markdown}
    </Streamdown>
  );
}
