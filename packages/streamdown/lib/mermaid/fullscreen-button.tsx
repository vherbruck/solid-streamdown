/**
 * Ported from vercel/streamdown packages/streamdown/lib/mermaid/fullscreen-button.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { createEffect, createSignal, type JSX, on, Show, splitProps, useContext } from "solid-js";
import { Dynamic } from "solid-js/web";
import { CodeBlockCopyButton } from "../code-block/copy-button";
import type { ControlsConfig } from "../streamdown-context";
import { useIcons } from "../icon-context";
import type { MermaidConfig } from "../plugin-types";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { useTranslations } from "../translations-context";
import { useUi } from "../ui-context";
import { Mermaid } from ".";
import { MermaidDownloadDropdown } from "./download-button";

type MermaidFullscreenButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  chart: string;
  config?: MermaidConfig;
  onFullscreen?: () => void;
  onExit?: () => void;
};

const showMermaidControl = (
  controlsConfig: ControlsConfig,
  control: "panZoom" | "download" | "copy"
): boolean => {
  if (typeof controlsConfig === "boolean") {
    return controlsConfig;
  }
  const mermaidCtl = controlsConfig.mermaid;
  if (mermaidCtl === false) {
    return false;
  }
  if (mermaidCtl === true || mermaidCtl === undefined) {
    return true;
  }
  return mermaidCtl[control] !== false;
};

export const MermaidFullscreenButton = (props: MermaidFullscreenButtonProps) => {
  const [local, rest] = splitProps(props, ["chart", "config", "onFullscreen", "onExit", "class"]);
  const icons = useIcons();
  const cn = useCn();
  const ui = useUi();
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  const context = useContext(StreamdownContext);
  const t = useTranslations();

  const handleToggle = () => {
    setIsFullscreen(!isFullscreen());
  };

  // Callbacks run apart from the overlay's scroll lock. As upstream, onExit
  // also runs on mount, while the diagram is not fullscreen.
  createEffect(
    on(isFullscreen, (fullscreen) => {
      if (fullscreen) {
        local.onFullscreen?.();
      } else {
        local.onExit?.();
      }
    })
  );

  return (
    <>
      <ui.Button
        class={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          local.class
        )}
        disabled={context.isAnimating}
        onClick={handleToggle}
        title={t.viewFullscreen}
        type="button"
        {...rest}
        aria-label={t.viewFullscreen}
      >
        <Dynamic aria-hidden="true" component={icons.Maximize2Icon} size={14} />
      </ui.Button>

      <ui.Overlay onClose={() => setIsFullscreen(false)} open={isFullscreen()}>
        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: "div is used as a backdrop overlay, not a button" */}
        <div
          aria-label={t.viewFullscreen}
          aria-modal="true"
          class={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          )}
          data-streamdown="mermaid-fullscreen"
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleToggle();
            }
          }}
          role="dialog"
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
          <div
            class={cn("absolute end-4 top-4 z-10 flex items-center gap-1")}
            onClick={(e) => e.stopPropagation()}
            // Native: Solid delegates onKeyDown to the document, too late to
            // shield the overlay's Escape listener.
            on:keydown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <Show when={showMermaidControl(context.controls, "download")}>
              <MermaidDownloadDropdown chart={local.chart} config={local.config} />
            </Show>
            <Show when={showMermaidControl(context.controls, "copy")}>
              <CodeBlockCopyButton code={local.chart} />
            </Show>
            <ui.Button
              aria-label={t.exitFullscreen}
              class={cn(
                "rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              )}
              onClick={handleToggle}
              title={t.exitFullscreen}
              type="button"
            >
              <Dynamic aria-hidden="true" component={icons.XIcon} size={20} />
            </ui.Button>
          </div>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
          <div
            class={cn("flex size-full items-center justify-center p-4")}
            onClick={(e) => e.stopPropagation()}
            on:keydown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <Mermaid
              chart={local.chart}
              class={cn("size-full [&_svg]:h-auto [&_svg]:w-auto")}
              config={local.config}
              fullscreen={true}
              showControls={showMermaidControl(context.controls, "panZoom")}
            />
          </div>
        </div>
      </ui.Overlay>
    </>
  );
};
