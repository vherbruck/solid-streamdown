import { describe, it, expect } from "vitest";
import { createRoot } from "solid-js";
import { createMarkdownStream } from "../src/create-markdown-stream";

describe("createMarkdownStream", () => {
  it("starts with empty content", () => {
    createRoot((dispose) => {
      const stream = createMarkdownStream();
      expect(stream.content()).toBe("");
      expect(stream.isStreaming()).toBe(true);
      dispose();
    });
  });

  it("starts with initial content when provided", () => {
    createRoot((dispose) => {
      const stream = createMarkdownStream({ initialContent: "Hello" });
      expect(stream.content()).toBe("Hello");
      dispose();
    });
  });

  it("accumulates chunks via write", () => {
    createRoot((dispose) => {
      const stream = createMarkdownStream();
      stream.write("Hello ");
      stream.write("world");
      expect(stream.content()).toBe("Hello world");
      dispose();
    });
  });

  it("sets isStreaming to false on end", () => {
    createRoot((dispose) => {
      const stream = createMarkdownStream();
      expect(stream.isStreaming()).toBe(true);
      stream.end();
      expect(stream.isStreaming()).toBe(false);
      dispose();
    });
  });

  it("resets stream state", () => {
    createRoot((dispose) => {
      const stream = createMarkdownStream();
      stream.write("Hello");
      stream.end();
      expect(stream.content()).toBe("Hello");
      expect(stream.isStreaming()).toBe(false);

      stream.reset();
      expect(stream.content()).toBe("");
      expect(stream.isStreaming()).toBe(true);
      dispose();
    });
  });

  it("resets to initial content", () => {
    createRoot((dispose) => {
      const stream = createMarkdownStream({ initialContent: "Start" });
      stream.write(" more");
      stream.reset();
      expect(stream.content()).toBe("Start");
      dispose();
    });
  });
});
