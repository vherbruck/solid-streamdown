import { math } from "@solid-streamdown/math";
import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown } from "../index";

it("server-renders KaTeX markup for display and inline math", () => {
  const html = renderToString(() => (
    <Streamdown mode="static" plugins={{ math }}>
      {"Inline $$a^2$$ math.\n\n$$\n\\frac{1}{2}\n$$"}
    </Streamdown>
  ));
  expect(html).toMatch(/class="katex ?"/);
  expect(html).toContain("katex-display");
  expect(html).toMatch(/<math\b/);
  expect(html).toContain('encoding="application/x-tex"');
  expect(html).not.toContain('style=""');
  expect(html).not.toContain('class=""');
});
