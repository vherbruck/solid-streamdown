import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown } from "../index";

it("server-renders a guarded link as a button without a modal", () => {
  const html = renderToString(() => (
    <Streamdown mode="static">{"[docs](https://example.com)"}</Streamdown>
  ));
  expect(html).toMatch(/<button[^>]*data-streamdown="link"/);
  expect(html).not.toContain("link-safety-modal");
});

it("server-renders a plain anchor when link safety is off", () => {
  const html = renderToString(() => (
    <Streamdown linkSafety={{ enabled: false }} mode="static">
      {"[docs](https://example.com)"}
    </Streamdown>
  ));
  expect(html).toMatch(/<a[^>]*href="https:\/\/example.com\/?"/);
  expect(html).toContain('rel="noreferrer"');
});
