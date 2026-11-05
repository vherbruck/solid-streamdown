/**
 * Ported from vercel/streamdown packages/streamdown/lib/use-pinned-scroll.ts @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

const BOTTOM_THRESHOLD_PX = 8;

/**
 * Resolve a max-height prop into a CSS value, or `undefined` when disabled.
 * `0` / `Infinity` (and their string forms) turn the constraint off.
 */
export const resolveMaxHeight = (
  maxHeight: number | string | undefined
): string | undefined => {
  if (
    maxHeight === undefined ||
    maxHeight === 0 ||
    maxHeight === Number.POSITIVE_INFINITY
  ) {
    return;
  }
  if (typeof maxHeight === "number") {
    if (!(Number.isFinite(maxHeight) && maxHeight > 0)) {
      return;
    }
    return `${maxHeight}px`;
  }
  if (maxHeight === "0" || maxHeight === "none" || maxHeight === "Infinity") {
    return;
  }
  return maxHeight;
};

/**
 * Keeps a scroll container pinned to the bottom while `isActive` is true.
 * Unpins when the user scrolls up; re-pins when they scroll back to the bottom
 * or when a new active session begins (`isActive` false → true).
 *
 * `contentKey` should change when content grows, so auto-scroll re-runs.
 * Returns a ref setter for the scroll container.
 */
export const createPinnedScroll = (
  isActive: Accessor<boolean>,
  enabled: Accessor<boolean>,
  contentKey: Accessor<unknown>
): ((element: HTMLElement) => void) => {
  const [element, setElement] = createSignal<HTMLElement>();
  let pinned = true;
  let wasActive = false;
  let frame: number | null = null;

  createEffect(() => {
    const el = element();
    if (!(el && enabled())) {
      return;
    }

    const handleScroll = () => {
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD_PX;
      pinned = atBottom;
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    onCleanup(() => el.removeEventListener("scroll", handleScroll));
  });

  createEffect(() => {
    const active = isActive();
    if (active && !wasActive) {
      // New streaming session — re-engage pin
      pinned = true;
    }
    if (!active) {
      pinned = true;
    }
    wasActive = active;
  });

  // Reading scrollHeight forces a layout, so content that grows several times
  // within a frame pins once, in the frame's own layout, rather than once per
  // update. A pending pin survives the stream ending, so the final content
  // still lands at the bottom.
  onCleanup(() => {
    if (frame !== null) {
      cancelAnimationFrame(frame);
    }
  });

  createEffect(() => {
    const el = element();
    // The content key is read (and so tracked) only while pinning can act,
    // so computing it costs nothing for static or unconstrained content.
    if (!(el && enabled() && isActive())) {
      return;
    }
    contentKey();
    if (!pinned || frame !== null) {
      return;
    }
    frame = requestAnimationFrame(() => {
      frame = null;
      if (pinned) {
        el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
      }
    });
  });

  return setElement;
};
