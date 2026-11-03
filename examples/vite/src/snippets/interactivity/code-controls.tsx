import { createSignal } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown = "```js\nconsole.log('hello');\n```";

// #region copy-callbacks
const CodeWithCopyStatus = () => {
  const [status, setStatus] = createSignal("");
  return (
    <>
      <Streamdown
        controls={{
          code: {
            copy: {
              onCopy: () => setStatus("Code copied"),
              onError: (error) => setStatus(error.message),
            },
          },
        }}
      >
        {markdown}
      </Streamdown>
      <p role="status">{status()}</p>
    </>
  );
};
// #endregion

// #region download-filename
// A JavaScript block downloads as myScript.js
const NamedDownload = () => (
  <Streamdown controls={{ code: { download: { filename: "myScript" } } }}>{markdown}</Streamdown>
);
// #endregion

export default function CodeControls() {
  return (
    <>
      <CodeWithCopyStatus />
      <NamedDownload />
    </>
  );
}
