import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { Streamdown } from "../index";

const header = "| Name | Value |\n|------|-------|\n";

afterEach(() => {
  document.body.style.overflow = "";
});

describe("table component under Streamdown", () => {
  it("keeps the wrapper, controls and an open menu while rows stream in", () => {
    const [text, setText] = createSignal(`${header}| a | 1 |\n`);
    const { container } = render(() => <Streamdown>{text()}</Streamdown>);
    const wrapper = container.querySelector('[data-streamdown="table-wrapper"]');
    const copy = container.querySelector('button[title="Copy table"]') as HTMLButtonElement;
    fireEvent.click(copy);
    expect(container.querySelector('button[title="Copy table as CSV"]')).not.toBeNull();

    setText(`${header}| a | 1 |\n| b | 2 |\n`);
    setText(`${header}| a | 1 |\n| b | 2 |\n| c | 3 |\n`);

    expect(container.querySelector('[data-streamdown="table-wrapper"]')).toBe(wrapper);
    expect(container.querySelector('button[title="Copy table"]')).toBe(copy);
    expect(container.querySelector('button[title="Copy table as CSV"]')).not.toBeNull();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
  });

  it("keeps the body locked until a link modal and the fullscreen table both close", () => {
    const { container } = render(() => (
      <Streamdown mode="static">{`${header}| [docs](https://example.com) | 1 |\n`}</Streamdown>
    ));
    fireEvent.click(container.querySelector('button[title="View fullscreen"]') as Element);
    const overlay = document.querySelector('[data-streamdown="table-fullscreen"]') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(overlay.querySelector('button[data-streamdown="link"]') as Element);
    const modal = document.querySelector('[data-streamdown="link-safety-modal"]') as HTMLElement;
    expect(modal).not.toBeNull();

    fireEvent.click(modal);
    expect(document.querySelector('[data-streamdown="link-safety-modal"]')).toBeNull();
    expect(document.querySelector('[data-streamdown="table-fullscreen"]')).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(document.querySelector('button[title="Exit fullscreen"]') as Element);
    expect(document.querySelector('[data-streamdown="table-fullscreen"]')).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("renders the fullscreen table as its own copy of the rows", () => {
    const { container } = render(() => (
      <Streamdown mode="static">{`${header}| a | 1 |\n`}</Streamdown>
    ));
    const inline = container.querySelector("table tbody");
    fireEvent.click(container.querySelector('button[title="View fullscreen"]') as Element);
    const overlay = document.querySelector('[data-streamdown="table-fullscreen"]');
    const copy = overlay?.querySelector("table tbody");
    expect(copy?.textContent).toContain("a");
    expect(copy).not.toBe(inline);
    expect(container.querySelector("table tbody")).toBe(inline);
    fireEvent.keyDown(document, { key: "Escape" });
  });

  it("hides every control when controls.table is false", () => {
    const { container } = render(() => (
      <Streamdown controls={{ table: false }} mode="static">{`${header}| a | 1 |\n`}</Streamdown>
    ));
    expect(container.querySelector('[data-streamdown="table-wrapper"] button')).toBeNull();
  });
});
