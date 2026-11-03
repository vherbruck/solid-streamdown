import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultRehypePlugins, type LinkSafetyConfig, Streamdown } from "../index";

const modal = () => document.querySelector('[data-streamdown="link-safety-modal"]');

afterEach(() => {
  vi.restoreAllMocks();
});

describe("link component under Streamdown", () => {
  it("swaps between a button and an anchor when linkSafety changes at runtime", () => {
    const [linkSafety, setLinkSafety] = createSignal<LinkSafetyConfig>({ enabled: true });
    const { container } = render(() => (
      <Streamdown linkSafety={linkSafety()} mode="static">
        {"[docs](https://example.com)"}
      </Streamdown>
    ));

    const button = container.querySelector('button[data-streamdown="link"]');
    expect(button).not.toBeNull();
    fireEvent.click(button as Element);
    expect(modal()).not.toBeNull();

    setLinkSafety({ enabled: false });
    expect(container.querySelector('a[data-streamdown="link"]')).not.toBeNull();
    expect(container.querySelector('button[data-streamdown="link"]')).toBeNull();
    expect(modal()).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps an open modal open while the link text streams", () => {
    const [text, setText] = createSignal("[do](https://example.com)");
    const { container } = render(() => <Streamdown>{text()}</Streamdown>);
    const button = container.querySelector('button[data-streamdown="link"]') as Element;
    fireEvent.click(button);
    expect(modal()).not.toBeNull();

    setText("[docs](https://example.com) and more");

    expect(container.querySelector('button[data-streamdown="link"]')).toBe(button);
    expect(button.textContent).toBe("docs");
    expect(modal()).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
  });

  it.each([true, false])(
    "never opens a javascript: URL with sanitize and harden removed (linkSafety %s)",
    (enabled) => {
      const open = vi.spyOn(window, "open").mockImplementation(() => null);
      const { container } = render(() => (
        <Streamdown
          linkSafety={{ enabled, onLinkCheck: () => true }}
          mode="static"
          rehypePlugins={[defaultRehypePlugins.raw]}
        >
          {'<a href="javascript:alert(1)">x</a>'}
        </Streamdown>
      ));
      const link = container.querySelector('[data-streamdown="link"]') as HTMLElement;
      expect(link.tagName).toBe("A");
      expect(link.hasAttribute("href")).toBe(false);
      fireEvent.click(link);
      expect(open).not.toHaveBeenCalled();
      expect(modal()).toBeNull();
    }
  );
});
