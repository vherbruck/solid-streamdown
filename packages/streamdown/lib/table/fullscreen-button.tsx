/**
 * Ported from vercel/streamdown packages/streamdown/lib/table/fullscreen-button.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { createSignal, type JSX, Show, useContext } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { useTranslations } from "../translations-context";
import { useUi } from "../ui-context";
import { TableCopyDropdown } from "./copy-dropdown";
import { TableDownloadDropdown } from "./download-dropdown";

interface TableFullscreenButtonProps {
  /**
   * The table's rows. Read each time the overlay opens, so the overlay holds
   * its own rendering of them rather than moving the inline table's DOM.
   */
  children: JSX.Element;
  class?: string;
  showCopy?: boolean;
  showDownload?: boolean;
}

export const TableFullscreenButton = (props: TableFullscreenButtonProps) => {
  const icons = useIcons();
  const cn = useCn();
  const ui = useUi();
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  const context = useContext(StreamdownContext);
  const t = useTranslations();

  const handleOpen = () => {
    setIsFullscreen(true);
  };

  const handleClose = () => {
    setIsFullscreen(false);
  };

  return (
    <>
      <ui.Button
        class={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          props.class
        )}
        disabled={context.isAnimating}
        onClick={handleOpen}
        title={t.viewFullscreen}
        type="button"
      >
        <Dynamic component={icons.Maximize2Icon} size={14} />
      </ui.Button>

      <ui.Overlay label={t.viewFullscreen} onClose={handleClose} open={isFullscreen()}>
        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: "dialog overlay needs click-to-dismiss" */}
        <div
          aria-label={t.viewFullscreen}
          aria-modal="true"
          class={cn("fixed inset-0 z-50 flex flex-col bg-background")}
          data-streamdown="table-fullscreen"
          onClick={handleClose}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleClose();
            }
          }}
          role="dialog"
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
          <div
            class={cn("flex h-full flex-col")}
            data-streamdown="table-wrapper"
            onClick={(e) => e.stopPropagation()}
            // A native listener: Solid delegates onKeyDown to the document,
            // where stopping propagation is too late for Escape listeners.
            on:keydown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div class={cn("flex items-center justify-end gap-1 p-4")}>
              <Show when={props.showCopy ?? true}>
                <TableCopyDropdown />
              </Show>
              <Show when={props.showDownload ?? true}>
                <TableDownloadDropdown />
              </Show>
              <ui.Button
                class={cn(
                  "rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                )}
                onClick={handleClose}
                title={t.exitFullscreen}
                type="button"
              >
                <Dynamic component={icons.XIcon} size={20} />
              </ui.Button>
            </div>
            <div
              class={cn(
                "flex-1 overflow-auto p-4 pt-0 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10"
              )}
            >
              <table
                class={cn("w-full border-collapse border border-border")}
                data-streamdown="table"
              >
                {props.children}
              </table>
            </div>
          </div>
        </div>
      </ui.Overlay>
    </>
  );
};
