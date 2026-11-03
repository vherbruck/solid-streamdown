import { Streamdown } from "solid-streamdown";

const markdown = "[Your app](https://your-app.com/docs) and [elsewhere](https://example.com).";

// #region sync
const SafelistedLinks = () => (
  <Streamdown
    linkSafety={{
      enabled: true,
      onLinkCheck: (url) =>
        // true opens the link directly; false shows the confirmation prompt
        url.startsWith("https://your-app.com") || url.startsWith("https://github.com"),
    }}
  >
    {markdown}
  </Streamdown>
);
// #endregion

// #region async
const ServerCheckedLinks = () => (
  <Streamdown
    linkSafety={{
      enabled: true,
      onLinkCheck: async (url) => {
        const response = await fetch("/api/check-url", {
          method: "POST",
          body: JSON.stringify({ url }),
        });
        const { isSafe } = await response.json();
        return isSafe;
      },
    }}
  >
    {markdown}
  </Streamdown>
);
// #endregion

export default function Safelist() {
  return (
    <>
      <SafelistedLinks />
      <ServerCheckedLinks />
    </>
  );
}
