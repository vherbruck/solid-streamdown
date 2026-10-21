import { cleanup } from "@solidjs/testing-library";
import * as matchers from "@testing-library/jest-dom/matchers";
import { afterEach, beforeEach, expect } from "vitest";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock IntersectionObserver for tests
beforeEach(() => {
  global.IntersectionObserver = class MockIntersectionObserver {
    private callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    disconnect() {
      // Mock implementation
    }

    observe(target: Element) {
      // Immediately trigger the callback with isIntersecting = true
      // This simulates the element being visible in the viewport
      setTimeout(() => {
        this.callback(
          [
            {
              isIntersecting: true,
              target,
              boundingClientRect: {} as DOMRectReadOnly,
              intersectionRatio: 1,
              intersectionRect: {} as DOMRectReadOnly,
              rootBounds: null,
              time: Date.now(),
            },
          ] as IntersectionObserverEntry[],
          this as unknown as IntersectionObserver,
        );
      }, 0);
    }

    takeRecords() {
      return [];
    }

    unobserve() {
      // Mock implementation
    }
  } as unknown as typeof IntersectionObserver;
});

// Mock scrollTo for jsdom (not implemented by default)
beforeEach(() => {
  window.HTMLElement.prototype.scrollTo = () => {};
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
