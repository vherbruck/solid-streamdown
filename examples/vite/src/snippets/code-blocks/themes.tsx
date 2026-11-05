import { code } from "@solid-streamdown/code";
import { Streamdown, type ThemeRegistrationAny } from "solid-streamdown";

const markdown = "```ts\nconst answer: number = 42;\n```";

// #region bundled
const DraculaCode = () => (
  <Streamdown plugins={{ code }} shikiTheme={["dracula", "dracula"]}>
    {markdown}
  </Streamdown>
);
// #endregion

// #region custom
// Any Shiki theme object works: a VS Code JSON theme file, or one written inline.
const myCustomDarkTheme: ThemeRegistrationAny = {
  name: "my-dark",
  type: "dark",
  colors: { "editor.background": "#1e1e2e", "editor.foreground": "#cdd6f4" },
  tokenColors: [
    { scope: ["keyword", "storage"], settings: { foreground: "#cba6f7" } },
    { scope: ["constant.numeric"], settings: { foreground: "#fab387" } },
  ],
};

const CustomThemeCode = () => (
  <Streamdown plugins={{ code }} shikiTheme={["github-light", myCustomDarkTheme]}>
    {markdown}
  </Streamdown>
);
// #endregion

export default function Themes() {
  return (
    <>
      <DraculaCode />
      <CustomThemeCode />
    </>
  );
}
