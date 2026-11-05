/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/portal.test.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { renderToString } from "solid-js/web";
import { expect, it, vi } from "vitest";
import { Streamdown } from "../index";

it("should not resolve the portal target during server rendering", () => {
  const getPortal = vi.fn(() => null);

  renderToString(() => (
    <Streamdown portal={getPortal}>{"| a |\n|---|\n| 1 |\n\n[x](https://example.com)"}</Streamdown>
  ));

  expect(getPortal).not.toHaveBeenCalled();
});
