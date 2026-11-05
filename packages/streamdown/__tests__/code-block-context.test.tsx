/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/code-block-context.test.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import {
  CodeBlockContext,
  useCodeBlockContext,
} from "../lib/code-block/context";
import { createEffect, createSignal } from "solid-js";

describe("CodeBlockContext", () => {
  it("should provide code value through context", () => {
    let capturedCode = "";

    const TestComponent = () => {
      const { code } = useCodeBlockContext();
      capturedCode = code;
      return <div>{code}</div>;
    };

    render(() => (
      <CodeBlockContext.Provider value={{ code: "test code" }}>
        <TestComponent />
      </CodeBlockContext.Provider>));

    expect(capturedCode).toBe("test code");
  });

  it("should work with default context value when no provider is used", () => {
    let capturedCode = "";

    const TestComponent = () => {
      const { code } = useCodeBlockContext();
      capturedCode = code;
      return <div>{code}</div>;
    };

    // Render without provider - should use default context value
    render(() => (<TestComponent />));

    // The default value from createContext is { code: "" }
    expect(capturedCode).toBe("");
  });

  it("should have default empty code value", () => {
    let capturedCode = "";

    const TestComponent = () => {
      const { code } = useCodeBlockContext();
      capturedCode = code;
      return <div>{code}</div>;
    };

    // Render with default context value
    render(() => (
      <CodeBlockContext.Provider value={{ code: "" }}>
        <TestComponent />
      </CodeBlockContext.Provider>));

    expect(capturedCode).toBe("");
  });

  it("should update when context value changes", () => {
    let capturedCode = "";
    const [code, setCode] = createSignal("initial");

    // The context value is read lazily, so a getter keeps consumers current.
    const TestComponent = () => {
      const context = useCodeBlockContext();
      createEffect(() => {
        capturedCode = context.code;
      });
      return <div>{context.code}</div>;
    };

    render(() => (
      <CodeBlockContext.Provider
        value={{
          get code() {
            return code();
          },
        }}
      >
        <TestComponent />
      </CodeBlockContext.Provider>
    ));

    expect(capturedCode).toBe("initial");

    setCode("updated");

    expect(capturedCode).toBe("updated");
  });
});
