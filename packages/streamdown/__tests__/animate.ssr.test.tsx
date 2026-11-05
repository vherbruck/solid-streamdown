import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown } from "../index";

it("server-renders animated word spans with their timing", () => {
  const html = renderToString(() => (
    <Streamdown animated isAnimating>
      {"one two\n\n- item"}
    </Streamdown>
  ));
  expect(html).toMatch(/<span[^>]*data-sd-animate[^>]*>one /);
  expect(html).toContain("--sd-animation:sd-fadeIn");
  expect(html).toContain("--sd-duration:150ms");
  expect(html).toContain("data-sd-animate-marker");
  expect(html).not.toContain('style=""');
  expect(html).not.toContain('class=""');
});
