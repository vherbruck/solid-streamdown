/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/portal.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { resolvePortalTarget } from "../lib/portal";

const markdownWithTable = `
| Name | Age |
|------|-----|
| Alice | 30 |
`;

describe("portal target", () => {
  it("should fall back to document.body when the portal getter returns null", () => {
    expect(resolvePortalTarget(() => null)).toBe(document.body);
  });

  // Upstream treats portal as an initializing prop: its memo comparator
  // ignores portal changes. Props here take effect when they change (see
  // UPSTREAM.md), so an overlay opens in the current target.
  it("should open overlays in the current portal target", () => {
    const firstRoot = document.createElement("div");
    const secondRoot = document.createElement("div");
    document.body.append(firstRoot, secondRoot);

    const [portal, setPortal] = createSignal<HTMLElement>(firstRoot);
    const { container, unmount } = render(() => (
      <Streamdown portal={portal()}>{markdownWithTable}</Streamdown>
    ));

    setPortal(secondRoot);

    const button = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(button);

    expect(firstRoot.querySelector('[data-streamdown="table-fullscreen"]')).toBeNull();
    expect(
      secondRoot.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeTruthy();

    unmount();
    firstRoot.remove();
    secondRoot.remove();
  });
});
