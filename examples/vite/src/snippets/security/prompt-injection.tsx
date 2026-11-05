import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const strict = {
  defaultOrigin: "https://your-app.com",
  allowedLinkPrefixes: ["https://your-app.com", "https://docs.your-app.com", "https://github.com"],
  allowedImagePrefixes: ["https://your-cdn.com"],
  allowedProtocols: [], // only harden's built-in safe protocols
  allowDataImages: false,
};

// More permissive for content your own users typed
const permissive = {
  allowedLinkPrefixes: ["*"],
  allowedImagePrefixes: ["*"],
  allowedProtocols: ["*"],
};

export function ChatMessage(props: { content: string; isAIGenerated: boolean }) {
  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        [harden, props.isAIGenerated ? strict : permissive],
      ]}
    >
      {props.content}
    </Streamdown>
  );
}

export default function Conversation() {
  return (
    <>
      <ChatMessage content="Can you link the docs?" isAIGenerated={false} />
      <ChatMessage content="See [the docs](https://docs.your-app.com/start)." isAIGenerated />
    </>
  );
}
