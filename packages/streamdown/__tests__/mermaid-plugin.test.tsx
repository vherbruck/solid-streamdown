import { mermaid } from "@solid-streamdown/mermaid";
import { render, waitFor } from "@solidjs/testing-library";
import { beforeAll, describe, expect, it } from "vitest";
import { Streamdown, type StreamdownProps } from "../index";

// jsdom lays nothing out; Mermaid measures text, so stub the SVG metrics as
// the plugin package's own tests do.
beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, "getBBox", {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 100, height: 50 }),
    writable: true,
  });
  Object.defineProperty(SVGElement.prototype, "getComputedTextLength", {
    configurable: true,
    value: () => 100,
    writable: true,
  });
});

describe("Streamdown with @solid-streamdown/mermaid", () => {
  it("accepts the real plugin where core expects a diagram plugin", () => {
    const plugins: StreamdownProps["plugins"] = { mermaid };
    expect(plugins?.mermaid?.language).toBe("mermaid");
  });

  it("renders a flowchart to an inserted SVG", { timeout: 20_000 }, async () => {
    const { container } = render(() => (
      <Streamdown mode="static" plugins={{ mermaid }}>
        {"```mermaid\ngraph TD;\n  A-->B;\n```"}
      </Streamdown>
    ));
    await waitFor(
      () => expect(container.querySelector('[data-streamdown="mermaid"] svg')).not.toBeNull(),
      { timeout: 15_000 }
    );
    expect(container.querySelector('[data-streamdown="mermaid-block"]')).not.toBeNull();
  });

  // HTML-in-label charts stall Mermaid's text measurement under jsdom, so
  // label sanitization (Mermaid's own DOMPurify step) is checked in a real
  // browser by plan 9's example smoke tests. This covers click callbacks.
  it("drops click callbacks under the default strict security level", async () => {
    const { container } = render(() => (
      <Streamdown mode="static" plugins={{ mermaid }}>
        {"```mermaid\ngraph TD;\n  A-->B;\n  click A call alert()\n```"}
      </Streamdown>
    ));
    await waitFor(
      () => expect(container.querySelector('[data-streamdown="mermaid"] svg')).not.toBeNull(),
      { timeout: 15_000 }
    );
    expect(container.querySelector("[onclick]")).toBeNull();
    expect(container.innerHTML).not.toContain("alert(");
  }, 20_000);
});
