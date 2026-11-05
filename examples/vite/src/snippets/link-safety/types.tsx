import { Streamdown } from "solid-streamdown";
// #region config
import type { LinkSafetyConfig, LinkSafetyModalProps } from "solid-streamdown";
import { CustomLinkModal } from "./custom-modal";

const config: LinkSafetyConfig = {
  enabled: true,
  onLinkCheck: (url) => url.startsWith("https://safe.com"),
  renderModal: (props: LinkSafetyModalProps) => <CustomLinkModal {...props} />,
};
// #endregion

export default function TypedConfig() {
  return <Streamdown linkSafety={config}>{"[Safe](https://safe.com) link."}</Streamdown>;
}
