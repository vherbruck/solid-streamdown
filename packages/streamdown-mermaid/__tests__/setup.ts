/**
 * Ported from vercel/streamdown packages/streamdown-mermaid/__tests__/setup.ts @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
// Mock SVG methods not available in jsdom
Object.defineProperty(SVGElement.prototype, "getBBox", {
  value: () => ({
    x: 0,
    y: 0,
    width: 100,
    height: 50,
  }),
  writable: true,
});

Object.defineProperty(SVGElement.prototype, "getComputedTextLength", {
  value: () => 100,
  writable: true,
});
