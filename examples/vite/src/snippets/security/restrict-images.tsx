import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = "Images from origins other than your CDN are not rendered.";

export default function Page() {
  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        [
          harden,
          {
            // Required whenever allowedImagePrefixes or allowedLinkPrefixes is not "*"
            defaultOrigin: "https://your-app.com",
            allowedImagePrefixes: ["https://your-cdn.com", "https://trusted-images.com"],
            allowedLinkPrefixes: ["*"],
            allowedProtocols: ["*"],
            allowDataImages: false, // Disable base64 images
          },
        ],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
