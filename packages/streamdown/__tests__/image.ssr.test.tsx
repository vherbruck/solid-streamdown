import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown } from "../index";

it("server-renders the image wrapper without a download button", () => {
  const html = renderToString(() => (
    <Streamdown mode="static">{"![logo](https://example.com/logo.png)"}</Streamdown>
  ));
  expect(html).toContain('data-streamdown="image-wrapper"');
  expect(html).toContain('data-streamdown="image"');
  expect(html).not.toContain("Download image");
  expect(html).not.toMatch(/<p[\s>]/);
});

it("server-renders the placeholder for an incomplete image", () => {
  const html = renderToString(() => <Streamdown>{"see ![the diag"}</Streamdown>);
  expect(html).toContain('data-streamdown="image-placeholder"');
});
