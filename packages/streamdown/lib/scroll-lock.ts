/**
 * Ported from vercel/streamdown packages/streamdown/lib/scroll-lock.ts @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
// Shared scroll lock utility with reference counting.
// Prevents bugs when multiple overlays (e.g. link modal inside fullscreen) are open simultaneously.
let activeCount = 0;

export const lockBodyScroll = () => {
  activeCount += 1;
  if (activeCount === 1) {
    document.body.style.overflow = "hidden";
  }
};

export const unlockBodyScroll = () => {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) {
    document.body.style.overflow = "";
  }
};
