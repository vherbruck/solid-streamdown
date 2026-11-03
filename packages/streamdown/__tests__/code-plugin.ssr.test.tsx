import { code } from "@solid-streamdown/code";
import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown } from "../index";

it("server-renders the unhighlighted body, since highlighting runs after mount", () => {
  const html = renderToString(() => (
    <Streamdown mode="static" plugins={{ code }}>
      {"```ts\nconst answer = 42;\n```"}
    </Streamdown>
  ));
  expect(html).toContain("const answer = 42;");
  expect(html).toContain("--sdm-c:inherit");
  expect(html).not.toMatch(/--sdm-c:#[0-9a-f]/i);
});
