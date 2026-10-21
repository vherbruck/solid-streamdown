import { renderToString } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { defaultRehypePlugins, Streamdown } from "../index";

const hostile =
  '<table><tbody><tr><td align="center;color:red;position:fixed">x</td></tr></tbody></table>\n\n' +
  '<script>window.__sdScript = 1</script>\n\n<img src="x" onerror="window.__sdImg = 1">\n\n<a href="javascript:alert(1)">l</a>';

describe("render guard on the server", () => {
  it("server-renders no injected CSS or script with the default pipeline", () => {
    const html = renderToString(() => <Streamdown mode="static">{hostile}</Streamdown>);
    expect(html).not.toContain("position:fixed");
    expect(html).not.toContain("color:red");
    expect(html).not.toContain("<script");
  });

  it("server-renders no script, handler or javascript: URL with sanitize and harden removed", () => {
    const html = renderToString(() => (
      <Streamdown mode="static" rehypePlugins={[defaultRehypePlugins.raw]}>
        {`${hostile}\n\n<button formaction="javascript:alert(1)">go</button>`}
      </Streamdown>
    )).toLowerCase();
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("position:fixed");
    expect(html).toContain("<button");
  });

  it("server-renders nothing for a paragraph mapped to script", () => {
    const html = renderToString(() => (
      <Streamdown components={{ p: "script" }} mode="static">
        {"window.__sdScript = 1"}
      </Streamdown>
    ));
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html).not.toContain("__sdScript");
  });
});
