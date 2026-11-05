import { fireEvent, render } from "@solidjs/testing-library";
import { type Component, createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultStreamdownContext, StreamdownContext } from "../lib/streamdown-context";
import {
  type UiButtonProps,
  defaultUiPrimitives,
  UiContext,
  useUi,
} from "../lib/ui-context";

const { Menu, MenuItem, Overlay } = defaultUiPrimitives;

afterEach(() => {
  document.body.style.overflow = "";
});

describe("Menu", () => {
  const renderMenu = () => {
    const onItem = vi.fn();
    const result = render(() => (
      <div>
        <span data-testid="outside">outside</span>
        <Menu
          panelClass="panel"
          trigger={({ open, props }) => (
            <button {...props} data-open={open()} data-testid="trigger" type="button">
              t
            </button>
          )}
        >
          {(close) => (
            <button
              data-testid="item"
              onClick={() => {
                onItem();
                close();
              }}
              type="button"
            >
              item
            </button>
          )}
        </Menu>
      </div>
    ));
    return { ...result, onItem };
  };

  it("opens and closes from the trigger", () => {
    const { getByTestId, queryByTestId } = renderMenu();
    expect(queryByTestId("item")).toBeNull();
    fireEvent.click(getByTestId("trigger"));
    expect(getByTestId("trigger").dataset.open).toBe("true");
    expect(getByTestId("item").parentElement?.className).toBe("panel");
    fireEvent.click(getByTestId("trigger"));
    expect(queryByTestId("item")).toBeNull();
  });

  it("closes on a mousedown outside and stays open on one inside", () => {
    const { getByTestId, queryByTestId } = renderMenu();
    fireEvent.click(getByTestId("trigger"));
    fireEvent.mouseDown(getByTestId("item"));
    expect(queryByTestId("item")).not.toBeNull();
    fireEvent.mouseDown(getByTestId("outside"));
    expect(queryByTestId("item")).toBeNull();
  });

  it("lets an item close the menu", () => {
    const { getByTestId, queryByTestId, onItem } = renderMenu();
    fireEvent.click(getByTestId("trigger"));
    fireEvent.click(getByTestId("item"));
    expect(onItem).toHaveBeenCalledOnce();
    expect(queryByTestId("item")).toBeNull();
  });

  it("wraps the trigger in a relative element passed to ref", () => {
    let wrapper: HTMLElement | undefined;
    render(() => (
      <Menu ref={(el) => (wrapper = el)} trigger={() => <button type="button">t</button>}>
        {() => null}
      </Menu>
    ));
    expect(wrapper?.className).toBe("relative");
  });

  it("puts the position classes before the panel classes", () => {
    const { getByTestId } = render(() => (
      <Menu
        panelClass="look"
        positionClass="place"
        trigger={({ props }) => (
          <button {...props} data-testid="trigger" type="button">
            t
          </button>
        )}
      >
        {() => <span data-testid="item">i</span>}
      </Menu>
    ));
    fireEvent.click(getByTestId("trigger"));
    expect(getByTestId("item").parentElement?.className).toBe("place look");
  });

  it("gives the trigger only a click handler, so its DOM is the caller's", () => {
    let triggerProps: Record<string, unknown> | undefined;
    render(() => (
      <Menu
        trigger={({ props }) => {
          triggerProps = props as Record<string, unknown>;
          return <button type="button">t</button>;
        }}
      >
        {() => null}
      </Menu>
    ));
    expect(Object.keys(triggerProps ?? {})).toEqual(["onClick"]);
  });
});

describe("MenuItem", () => {
  it("renders a type=button element that runs onSelect", () => {
    const onSelect = vi.fn();
    const { getByRole } = render(() => (
      <MenuItem aria-label="pick" class="item" onSelect={onSelect} title="Pick">
        Pick
      </MenuItem>
    ));
    const item = getByRole("button", { name: "pick" });
    expect(item.getAttribute("type")).toBe("button");
    expect(item.className).toBe("item");
    expect(item.getAttribute("title")).toBe("Pick");
    fireEvent.click(item);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("renders through the current Button", () => {
    const CustomButton: Component<UiButtonProps> = (props) => (
      <button data-custom="" type="button" {...props} />
    );
    const { container } = render(() => (
      <UiContext.Provider value={{ ...defaultUiPrimitives, Button: CustomButton }}>
        <MenuItem onSelect={() => undefined}>Pick</MenuItem>
      </UiContext.Provider>
    ));
    expect(container.querySelector("button[data-custom]")?.textContent).toBe("Pick");
  });
});

describe("Overlay", () => {
  it("renders into the portal target only while open", () => {
    const target = document.createElement("div");
    document.body.append(target);
    const [open, setOpen] = createSignal(false);
    render(() => (
      <StreamdownContext.Provider value={{ ...defaultStreamdownContext, portal: target }}>
        <Overlay onClose={() => setOpen(false)} open={open()}>
          <div data-testid="content">c</div>
        </Overlay>
      </StreamdownContext.Provider>
    ));
    expect(target.querySelector("[data-testid='content']")).toBeNull();
    setOpen(true);
    expect(target.querySelector("[data-testid='content']")).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");
    setOpen(false);
    expect(target.querySelector("[data-testid='content']")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    target.remove();
  });

  it("ignores its label, since the content names itself", () => {
    const target = document.createElement("div");
    document.body.append(target);
    render(() => (
      <StreamdownContext.Provider value={{ ...defaultStreamdownContext, portal: target }}>
        <Overlay label="Name" onClose={() => undefined} open>
          <div data-testid="content">c</div>
        </Overlay>
      </StreamdownContext.Provider>
    ));
    expect(target.querySelector("[data-testid='content']")).not.toBeNull();
    expect(target.querySelector("[aria-label], [role]")).toBeNull();
    target.remove();
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(() => (
      <Overlay onClose={onClose} open>
        <div>c</div>
      </Overlay>
    ));
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the body locked until every open overlay closes", () => {
    const [first, setFirst] = createSignal(true);
    const [second, setSecond] = createSignal(true);
    render(() => (
      <>
        <Overlay onClose={() => setFirst(false)} open={first()}>
          <div>a</div>
        </Overlay>
        <Overlay onClose={() => setSecond(false)} open={second()}>
          <div>b</div>
        </Overlay>
      </>
    ));
    expect(document.body.style.overflow).toBe("hidden");
    setSecond(false);
    expect(document.body.style.overflow).toBe("hidden");
    setFirst(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("releases the lock when unmounted while open", () => {
    const { unmount } = render(() => (
      <Overlay onClose={() => undefined} open>
        <div>a</div>
      </Overlay>
    ));
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("UiContext", () => {
  it("lets a provider replace a primitive", () => {
    const CustomButton: Component<UiButtonProps> = (props) => (
      <button data-custom="" type="button" {...props} />
    );
    const Consumer = () => {
      const ui = useUi();
      return <ui.Button>go</ui.Button>;
    };
    const { container } = render(() => (
      <UiContext.Provider value={{ ...defaultUiPrimitives, Button: CustomButton }}>
        <Consumer />
      </UiContext.Provider>
    ));
    expect(container.querySelector("button[data-custom]")).not.toBeNull();
  });

  it("defaults to a type=button element", () => {
    const Consumer = () => {
      const ui = useUi();
      return <ui.Button>go</ui.Button>;
    };
    const { container } = render(() => <Consumer />);
    expect(container.querySelector("button")?.getAttribute("type")).toBe("button");
  });
});
