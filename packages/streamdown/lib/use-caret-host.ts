/**
 * Ported from vercel/streamdown packages/streamdown/lib/use-caret-host.ts @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type Accessor, createEffect } from "solid-js";
import { isServer } from "solid-js/web";

const HIDDEN_ATTRIBUTE = "data-sd-caret-hidden";

interface CaretHost {
  ref: (el: HTMLDivElement) => void;
  showCaret: Accessor<boolean>;
}

/**
 * Hide the caret by marking the element that ends the document with
 * `data-sd-caret-hidden`, and report whether the container should keep its
 * caret classes.
 */
export const createCaretHost = (shouldHide: Accessor<boolean>): CaretHost => {
  let container: HTMLDivElement | undefined;
  let marked: Element | null = null;

  // Only the client can mark the caret's host, so server markup leaves the
  // caret off the container whenever it should be hidden. Solid's
  // createEffect runs after the DOM updates, like upstream's useLayoutEffect.
  createEffect(() => {
    const host = shouldHide() ? (container?.lastElementChild ?? null) : null;
    if (marked === host) {
      return;
    }
    marked?.removeAttribute(HIDDEN_ATTRIBUTE);
    host?.setAttribute(HIDDEN_ATTRIBUTE, "");
    marked = host;
  });

  return {
    ref: (el) => {
      container = el;
    },
    showCaret: () => !isServer || !shouldHide(),
  };
};
