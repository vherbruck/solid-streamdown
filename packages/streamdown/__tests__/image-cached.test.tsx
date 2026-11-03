/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/image-cached.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { defaultStreamdownContext } from "../lib/streamdown-context";
import { ImageComponent } from "../lib/image";

describe("ImageComponent cached image on mount", () => {
  it("should set imageLoaded when img.complete is true and naturalWidth > 0 on mount", () => {
    // We need to mock the ref to have an element with complete=true and naturalWidth>0
    // The useEffect runs after mount, so we need to set up the DOM element properties
    const { container } = render(() => (
      <StreamdownContext.Provider
        value={{
          ...defaultStreamdownContext,
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ImageComponent
          alt="test"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      </StreamdownContext.Provider>));

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeTruthy();

    // The useEffect for cached images checks img.complete and img.naturalWidth
    // In jsdom, img.complete defaults to false, so we need to trigger the effect
    // by updating the property and re-triggering the effect via src change.

    // Instead, let's directly test the download path when image is loaded via onLoad
    fireEvent.load(img);

    // After load, imageLoaded should be true, showing download button
    const downloadBtn = container.querySelector(
      'button[title="Download image"]'
    );
    expect(downloadBtn).toBeTruthy();
  });

  it("should set imageError when img.complete is true but naturalWidth is 0", () => {
    // Create a component and simulate a broken cached image
    const onError = vi.fn();
    const { container } = render(() => (
      <StreamdownContext.Provider
        value={{
          ...defaultStreamdownContext,
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ImageComponent
          alt="broken"
          onError={onError}
          src="https://example.com/broken.png"
        />
      </StreamdownContext.Provider>));

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeTruthy();

    // Trigger error to simulate broken image
    fireEvent.error(img);

    expect(onError).toHaveBeenCalled();
  });

  it("should handle downloadImage with no src (line 62-63)", () => {
    // Render image, then try to click download after removing src conceptually
    // The guard `if (!src) return` is on line 62-63 of image.tsx
    // This is the downloadImage function, which checks src before fetching
    const { container } = render(() => (
      <StreamdownContext.Provider
        value={{
          ...defaultStreamdownContext,
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ImageComponent
          alt="test"
          src="https://example.com/image.png"
          width={100}
        />
      </StreamdownContext.Provider>));

    // With explicit dimensions, download button should be visible
    const downloadBtn = container.querySelector(
      'button[title="Download image"]'
    );
    expect(downloadBtn).toBeTruthy();
  });
});

describe("ImageComponent image complete before mount", () => {
  const stubImage = (naturalWidth: number) => {
    const complete = vi
      .spyOn(HTMLImageElement.prototype, "complete", "get")
      .mockReturnValue(true);
    const width = vi
      .spyOn(HTMLImageElement.prototype, "naturalWidth", "get")
      .mockReturnValue(naturalWidth);
    return () => {
      complete.mockRestore();
      width.mockRestore();
    };
  };

  it("shows the download button for an image that loaded before mount", () => {
    const restore = stubImage(10);
    const { container } = render(() => (
      <ImageComponent alt="cached" src="https://example.com/cached.png" />
    ));
    restore();
    expect(container.querySelector('button[title="Download image"]')).toBeTruthy();
  });

  it("shows the fallback for an image that failed before mount", () => {
    const restore = stubImage(0);
    const { container } = render(() => (
      <ImageComponent alt="broken" src="https://example.com/broken.png" />
    ));
    restore();
    expect(container.querySelector('[data-streamdown="image-fallback"]')).toBeTruthy();
  });
});
