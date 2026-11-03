import remend from "remend";

// #region basic
const partialMarkdown = "This is **incomplete bold";
const completed = remend(partialMarkdown);
// Result: "This is **incomplete bold**"
// #endregion

// #region link-mode
// Default behavior: use placeholder URL
remend("[Click here](http://exampl");
// Result: "[Click here](streamdown:incomplete-link)"

// Text-only mode: display plain text
remend("[Click here](http://exampl", { linkMode: "text-only" });
// Result: "Click here"
// #endregion

export default function RemendStandalone() {
  return (
    <pre class="text-sm">
      {partialMarkdown} → {completed}
    </pre>
  );
}
