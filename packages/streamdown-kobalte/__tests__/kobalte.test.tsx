import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { Streamdown } from "solid-streamdown";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { kobalteUi } from "../index";

const TABLE = "| Name | Age |\n| --- | --- |\n| Alice | 30 |";

const renderTable = () =>
  render(() => (
    <Streamdown mode="static" ui={kobalteUi}>
      {TABLE}
    </Streamdown>
  ));

const openMenu = (trigger: Element) => {
  fireEvent.keyDown(trigger, { key: "Enter" });
};

describe("menus", () => {
  const written: ClipboardItem[][] = [];

  beforeEach(() => {
    written.length = 0;
    vi.stubGlobal(
      "ClipboardItem",
      class {
        constructor(readonly items: Record<string, Blob>) {}
      }
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        write: async (items: ClipboardItem[]) => {
          written.push(items);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens from the keyboard as a menu of menu items", async () => {
    const { container } = renderTable();
    const trigger = container.querySelector('button[title="Copy table"]') as HTMLElement;
    expect(trigger.getAttribute("aria-haspopup")).toBe("true");
    openMenu(trigger);
    const menu = await waitFor(() => {
      const element = document.querySelector('[role="menu"]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect([...menu.querySelectorAll('[role="menuitem"]')].map((item) => item.textContent)).toEqual([
      "Markdown",
      "CSV",
      "TSV",
    ]);
    // Portaled out of the control, with Streamdown's panel classes and no
    // in-flow positioning.
    expect(container.contains(menu)).toBe(false);
    expect(menu.className).toContain("rounded-md");
    expect(menu.className).not.toContain("absolute");
  });

  it("runs an item, finds the table through the portaled panel, and closes", async () => {
    const { container } = renderTable();
    openMenu(container.querySelector('button[title="Copy table"]') as HTMLElement);
    const item = await waitFor(() => {
      const element = document.querySelector('[role="menuitem"][title="Copy table as CSV"]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    // Kobalte selects on Enter, or on pointer up; jsdom has no pointer events.
    fireEvent.keyDown(item, { key: "Enter" });
    await waitFor(() => expect(written.length).toBe(1));
    const plain = (written[0][0] as unknown as { items: Record<string, Blob> }).items["text/plain"];
    expect(await plain.text()).toBe("Name,Age\nAlice,30");
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  });

  it("renders the trigger through the Kobalte button", () => {
    const { container } = renderTable();
    const trigger = container.querySelector('button[title="Copy table"]') as HTMLElement;
    expect(trigger.getAttribute("type")).toBe("button");
    expect(trigger.className).toContain("cursor-pointer");
  });
});

describe("overlays", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("opens the fullscreen table as a labelled dialog that holds focus", async () => {
    const { container } = renderTable();
    fireEvent.click(container.querySelector('button[title="View fullscreen"]') as HTMLElement);
    const dialog = await waitFor(() => {
      const element = document.querySelector('[role="dialog"][aria-label="View fullscreen"]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    expect(dialog.querySelector('[data-streamdown="table-fullscreen"]')).not.toBeNull();
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it("closes on Escape", async () => {
    const { container } = renderTable();
    fireEvent.click(container.querySelector('button[title="View fullscreen"]') as HTMLElement);
    await waitFor(() => expect(document.querySelector('[data-streamdown="table-fullscreen"]')).not.toBeNull());
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(document.querySelector('[data-streamdown="table-fullscreen"]')).toBeNull());
  });

  it("names the link-safety prompt", async () => {
    const { container } = render(() => (
      <Streamdown mode="static" ui={kobalteUi}>
        {"[docs](https://example.com)"}
      </Streamdown>
    ));
    fireEvent.click(container.querySelector('button[data-streamdown="link"]') as HTMLElement);
    const dialog = await waitFor(() => {
      const element = document.querySelector('[role="dialog"][aria-label="Open external link?"]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    expect(dialog.querySelector('[data-streamdown="link-safety-modal"]')).not.toBeNull();
  });
});
