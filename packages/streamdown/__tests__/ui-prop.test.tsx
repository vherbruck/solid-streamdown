import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { type Component, createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import {
  defaultUiPrimitives,
  Streamdown,
  type UiButtonProps,
  type UiMenuItemProps,
  type UiMenuProps,
  type UiOverlayProps,
  usePortalTarget,
} from "../index";

// A code block, a table, an image and a link: every control a document can
// show without a plugin.
const DOCUMENT = [
  "```js\nconst a = 1;\n```",
  "| A | B |\n| --- | --- |\n| 1 | 2 |",
  "![logo](https://example.com/logo.png)",
  "[docs](https://example.com)",
].join("\n\n");

const CustomButton: Component<UiButtonProps> = (props) => (
  <button data-custom="" type="button" {...props} />
);

const buttons = (root: ParentNode) => [...root.querySelectorAll("button")];

describe("the ui prop", () => {
  it("renders every control's button through a custom Button", () => {
    const { container } = render(() => (
      <Streamdown mode="static" ui={{ Button: CustomButton }}>
        {DOCUMENT}
      </Streamdown>
    ));
    const all = buttons(container);
    // The image's download button appears once the image loads.
    expect(all.map((button) => button.getAttribute("title") ?? button.dataset.streamdown)).toEqual([
      "Download file",
      "Copy Code",
      "Copy table",
      "Download table",
      "View fullscreen",
      "link",
    ]);
    expect(all.filter((button) => !button.hasAttribute("data-custom"))).toEqual([]);
  });

  it("renders the Mermaid controls through a custom Button", async () => {
    const mermaid = {
      name: "mermaid" as const,
      type: "diagram" as const,
      language: "mermaid",
      getMermaid: () => ({
        initialize: () => undefined,
        render: async () => ({ svg: "<svg><text>Chart</text></svg>" }),
      }),
    };
    const { container } = render(() => (
      <Streamdown mode="static" plugins={{ mermaid }} ui={{ Button: CustomButton }}>
        {"```mermaid\ngraph TD; A-->B\n```"}
      </Streamdown>
    ));
    const block = container.querySelector('[data-streamdown="mermaid-block"]') as HTMLElement;
    await waitFor(() => expect(buttons(block).length).toBeGreaterThanOrEqual(3));
    expect(buttons(block).filter((button) => !button.hasAttribute("data-custom"))).toEqual([]);
  });

  it("renders menu items through the custom Button too, unless MenuItem is replaced", () => {
    const { container } = render(() => (
      <Streamdown mode="static" ui={{ Button: CustomButton }}>
        {DOCUMENT}
      </Streamdown>
    ));
    fireEvent.click(container.querySelector('button[title="Copy table"]') as Element);
    const item = container.querySelector('button[title="Copy table as Markdown"]');
    expect(item?.hasAttribute("data-custom")).toBe(true);
  });

  it("keeps the defaults for entries left out", () => {
    const CustomItem: Component<UiMenuItemProps> = (props) => (
      <button data-item="" onClick={() => props.onSelect()} title={props.title} type="button">
        {props.children}
      </button>
    );
    const { container } = render(() => (
      <Streamdown mode="static" ui={{ MenuItem: CustomItem }}>
        {DOCUMENT}
      </Streamdown>
    ));
    const trigger = container.querySelector('button[title="Download table"]') as HTMLElement;
    expect(trigger.hasAttribute("data-item")).toBe(false);
    fireEvent.click(trigger);
    const items = [...container.querySelectorAll("button[data-item]")].map((b) => b.getAttribute("title"));
    expect(items).toEqual(["Download table as CSV", "Download table as Markdown"]);
    // The default menu still places the panel in flow.
    expect(container.querySelector("button[data-item]")?.parentElement?.className).toContain("absolute");
  });

  it("hands a custom Menu the trigger props and both class sets", () => {
    const seen: UiMenuProps[] = [];
    const RecordingMenu: Component<UiMenuProps> = (props) => {
      seen.push(props);
      return <defaultUiPrimitives.Menu {...props} />;
    };
    const { container } = render(() => (
      <Streamdown mode="static" ui={{ Menu: RecordingMenu }}>
        {DOCUMENT}
      </Streamdown>
    ));
    expect(seen.length).toBe(2);
    expect(seen.map((menu) => menu.positionClass)).toEqual([
      "absolute end-0 top-full z-20 mt-1",
      "absolute end-0 top-full z-20 mt-1",
    ]);
    expect(seen[0].panelClass).not.toContain("absolute");
    fireEvent.click(container.querySelector('button[title="Copy table"]') as Element);
    expect(container.querySelector('button[title="Copy table as CSV"]')).not.toBeNull();
  });

  it("opens a custom Overlay with its label, and closes it through onClose", async () => {
    const CustomOverlay: Component<UiOverlayProps> = (props) => (
      <>
        {props.open && (
          <section aria-label={props.label} role="dialog">
            <button onClick={() => props.onClose()} type="button">
              dismiss
            </button>
            {props.children}
          </section>
        )}
      </>
    );
    const { container, getByRole } = render(() => (
      <Streamdown mode="static" ui={{ Overlay: CustomOverlay }}>
        {DOCUMENT}
      </Streamdown>
    ));
    const overlay = () => container.querySelector("section[role=dialog]");
    fireEvent.click(container.querySelector('button[title="View fullscreen"]') as Element);
    expect(overlay()?.getAttribute("aria-label")).toBe("View fullscreen");
    expect(overlay()?.querySelector('[data-streamdown="table-fullscreen"]')).not.toBeNull();
    fireEvent.click(getByRole("button", { name: "dismiss" }));
    await waitFor(() => expect(overlay()).toBeNull());

    fireEvent.click(container.querySelector('button[data-streamdown="link"]') as Element);
    expect(overlay()?.getAttribute("aria-label")).toBe("Open external link?");
  });

  it("reads ui once, so a later change recreates nothing", () => {
    const [ui, setUi] = createSignal<{ Button?: Component<UiButtonProps> }>({});
    const { container } = render(() => (
      <Streamdown mode="static" ui={ui()}>
        {DOCUMENT}
      </Streamdown>
    ));
    const before = buttons(container);
    setUi({ Button: CustomButton });
    const after = buttons(container);
    expect(after).toEqual(before);
    expect(after.every((button, index) => button === before[index])).toBe(true);
    expect(container.querySelector("button[data-custom]")).toBeNull();
  });
});

describe("usePortalTarget", () => {
  it("resolves Streamdown's portal prop, defaulting to document.body", () => {
    const target = document.createElement("div");
    const resolved: HTMLElement[] = [];
    const Probe: Component<UiButtonProps> = (props) => {
      const portal = usePortalTarget();
      resolved.push(portal());
      return <button type="button" {...props} />;
    };
    render(() => (
      <>
        <Streamdown mode="static" ui={{ Button: Probe }}>
          {"```js\nx\n```"}
        </Streamdown>
        <Streamdown mode="static" portal={target} ui={{ Button: Probe }}>
          {"```js\nx\n```"}
        </Streamdown>
      </>
    ));
    expect(resolved).toContain(document.body);
    expect(resolved).toContain(target);
  });
});
