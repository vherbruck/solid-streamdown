import { harden } from "rehype-harden";
import rehypeSanitize, { type Options as SanitizeSchema } from "rehype-sanitize";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = "Open the [settings](vscode://settings) in your editor.";

// #region options
const CUSTOM_PROTOCOLS = ["postman", "vscode", "slack"];

// rehype-sanitize keeps only the link protocols its schema lists.
const [, baseSchema] = defaultRehypePlugins.sanitize as [unknown, SanitizeSchema];
const schema: SanitizeSchema = {
  ...baseSchema,
  protocols: {
    ...baseSchema.protocols,
    href: [...(baseSchema.protocols?.href ?? []), ...CUSTOM_PROTOCOLS],
  },
};

const AppLinks = () => (
  <Streamdown
    rehypePlugins={[
      defaultRehypePlugins.raw,
      [rehypeSanitize, schema],
      [
        harden,
        {
          allowedLinkPrefixes: ["*"],
          allowedImagePrefixes: ["*"],
          // rehype-harden compares protocols with their trailing colon.
          allowedProtocols: CUSTOM_PROTOCOLS.map((protocol) => `${protocol}:`),
        },
      ],
    ]}
  >
    {markdown}
  </Streamdown>
);
// #endregion

export default function CustomProtocols() {
  return <AppLinks />;
}
