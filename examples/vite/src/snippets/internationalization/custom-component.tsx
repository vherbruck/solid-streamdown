import type { JSX } from "solid-js";
// #region imports
import type { StreamdownTranslations } from "solid-streamdown";
import { defaultTranslations, Streamdown } from "solid-streamdown";
// #endregion

// #region shared
// One object for Streamdown and for your own components.
const labels: StreamdownTranslations = {
  ...defaultTranslations,
  copyCode: "Copiar código",
};

const CustomCodeBlock = (props: { children?: JSX.Element }) => (
  <div>
    <button type="button">{labels.copyCode}</button>
    <pre>
      <code>{props.children}</code>
    </pre>
  </div>
);

const Page = (props: { markdown: string }) => (
  <Streamdown components={{ code: CustomCodeBlock }} translations={labels}>
    {props.markdown}
  </Streamdown>
);
// #endregion

export default function SharedLabels() {
  return <Page markdown={"```\nconst x = 1;\n```"} />;
}
