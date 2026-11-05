import { createAnimatePlugin, defaultRehypePlugins, Streamdown } from "solid-streamdown";

const animate = createAnimatePlugin({
  animation: "blurIn",
  duration: 200,
});

// animate.rehypePlugin is a standard rehype plugin
const rehypePlugins = [...Object.values(defaultRehypePlugins), animate.rehypePlugin];

export default function AnimatePlugin() {
  return (
    <Streamdown mode="static" rehypePlugins={rehypePlugins}>
      {"Every word of this static text blurs in once, on mount."}
    </Streamdown>
  );
}
