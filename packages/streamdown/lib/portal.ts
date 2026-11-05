/**
 * Ported from vercel/streamdown packages/streamdown/lib/portal.ts @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import type { PortalTarget } from "./streamdown-context";

export const resolvePortalTarget = (
  portal: PortalTarget | undefined
): HTMLElement => {
  const container = typeof portal === "function" ? portal() : portal;
  return container ?? document.body;
};
