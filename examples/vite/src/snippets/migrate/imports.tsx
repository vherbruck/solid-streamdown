// #region component
import { Streamdown } from "solid-streamdown";
// #endregion
// #region types
import type { AllowElement, Components, ExtraProps, UrlTransform } from "solid-streamdown";
// #endregion
// #region props
import type { StreamdownProps } from "solid-streamdown";
// #endregion
import type { JSX } from "solid-js";

const components: Components = {
  em: (props: JSX.IntrinsicElements["em"] & ExtraProps) => <em class="text-primary">{props.children}</em>,
};
const allowElement: AllowElement = (element) => element.tagName !== "img";
const urlTransform: UrlTransform = (url) => url;
const options: StreamdownProps = { components, allowElement, urlTransform };

export default function Page() {
  return <Streamdown {...options}>{"Now *rendered* by solid-streamdown."}</Streamdown>;
}
