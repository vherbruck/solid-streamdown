import { createSignal } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nexport const answer = 42;\n```";

// #region copy-callbacks
const CopyWithCallbacks = () => {
  const [status, setStatus] = createSignal("");
  return (
    <>
      <Streamdown
        controls={{
          code: {
            copy: {
              onCopy: () => setStatus("Copied to clipboard"),
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

// #region disable
// Hide the download button, keep copy
const CopyOnly = () => <Streamdown controls={{ code: { download: false } }}>{markdown}</Streamdown>;

// Hide the copy button, keep download
const DownloadOnly = () => <Streamdown controls={{ code: { copy: false } }}>{markdown}</Streamdown>;

// Hide all code block controls
const NoCodeControls = () => <Streamdown controls={{ code: false }}>{markdown}</Streamdown>;

// Hide all controls across all block types
const NoControls = () => <Streamdown controls={false}>{markdown}</Streamdown>;
// #endregion

// #region download-filename
const NamedDownload = () => (
  <Streamdown controls={{ code: { download: { filename: "myScript" } } }}>{markdown}</Streamdown>
);
// #endregion

export default function CodeControls() {
  return (
    <>
      <CopyWithCallbacks />
      <CopyOnly />
      <DownloadOnly />
      <NoCodeControls />
      <NoControls />
      <NamedDownload />
    </>
  );
}
