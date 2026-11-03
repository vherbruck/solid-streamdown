import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("image component under Streamdown", () => {
  it("fetches the image with no options, so no credentials mode is set", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ blob: async () => new Blob(["x"], { type: "image/png" }) } as Response);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const { container } = render(() => (
      <Streamdown mode="static">{"![logo](https://example.com/logo.png)"}</Streamdown>
    ));
    fireEvent.load(container.querySelector("img") as HTMLImageElement);
    fireEvent.click(container.querySelector('button[title="Download image"]') as Element);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(fetchSpy.mock.calls[0]).toEqual(["https://example.com/logo.png"]);
  });

  it("renders an image alone in a paragraph without the <p>", () => {
    const { container } = render(() => (
      <Streamdown mode="static">{"![logo](https://example.com/logo.png)"}</Streamdown>
    ));
    const wrapper = container.querySelector('[data-streamdown="image-wrapper"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.closest("p")).toBeNull();
  });

  it("hides the download control when controls.image is false", () => {
    const { container } = render(() => (
      <Streamdown controls={{ image: false }} mode="static">
        {"![logo](https://example.com/logo.png)"}
      </Streamdown>
    ));
    fireEvent.load(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector('button[title="Download image"]')).toBeNull();
    expect(container.querySelector('[data-streamdown="image-overlay"]')).toBeNull();
  });

  it("keeps the image element while surrounding text streams", () => {
    const { container } = render(() => (
      <Streamdown>{"![logo](https://example.com/logo.png)\n\nmore"}</Streamdown>
    ));
    const img = container.querySelector("img");
    fireEvent.load(img as HTMLImageElement);
    expect(container.querySelector('button[title="Download image"]')).not.toBeNull();
  });
});
