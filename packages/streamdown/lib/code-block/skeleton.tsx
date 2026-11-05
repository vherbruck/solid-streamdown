/**
 * Ported from vercel/streamdown packages/streamdown/lib/code-block/skeleton.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { Dynamic } from "solid-js/web";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";

export const CodeBlockSkeleton = () => {
  const icons = useIcons();
  const cn = useCn();
  return (
    <div class={cn("w-full divide-y divide-border overflow-hidden rounded-xl border border-border")}>
      <div class={cn("h-[46px] w-full bg-muted/80")} />
      <div class={cn("flex w-full items-center justify-center p-4")}>
        <Dynamic class={cn("size-4 animate-spin")} component={icons.Loader2Icon} />
      </div>
    </div>
  );
};
