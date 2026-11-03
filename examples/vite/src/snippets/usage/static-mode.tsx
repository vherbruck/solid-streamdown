import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

export function BlogPost(props: { content: string }) {
  return (
    <Streamdown mode="static" plugins={{ code }}>
      {props.content}
    </Streamdown>
  );
}

export default function Page() {
  return <BlogPost content={"# My post\n\nWritten **before** it was rendered."} />;
}
