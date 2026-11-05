/**
 * Ported from vercel/streamdown packages/streamdown/lib/mermaid/download-button.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type JSX, useContext } from "solid-js";
import { Dynamic } from "solid-js/web";
import { getDownloadFilename } from "../controls";
import { useIcons } from "../icon-context";
import { useMermaidPlugin } from "../plugin-context";
import type { MermaidConfig } from "../plugin-types";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { useTranslations } from "../translations-context";
import { useUi } from "../ui-context";
import { save } from "../utils";
import { serializeSvgForDownload, svgToPngBlob } from "./utils";

interface MermaidDownloadDropdownProps {
  chart: string;
  children?: JSX.Element;
  class?: string;
  config?: MermaidConfig;
  onDownload?: (format: "mmd" | "png" | "svg") => void;
  onError?: (error: Error) => void;
}

export const MermaidDownloadDropdown = (props: MermaidDownloadDropdownProps) => {
  const cn = useCn();
  const ui = useUi();
  const context = useContext(StreamdownContext);
  const icons = useIcons();
  const mermaidPlugin = useMermaidPlugin();
  const t = useTranslations();

  const downloadMermaid = async (format: "mmd" | "png" | "svg", close: () => void) => {
    const chart = props.chart;
    const baseFilename = getDownloadFilename(context.controls, "mermaid", "diagram");
    try {
      if (format === "mmd") {
        // Download as Mermaid source code
        save(`${baseFilename}.mmd`, chart, "text/plain");
        close();
        props.onDownload?.(format);
        return;
      }

      const plugin = mermaidPlugin();
      if (!plugin) {
        props.onError?.(new Error("Mermaid plugin not available"));
        return;
      }

      const mermaid = plugin.getMermaid(props.config);

      // Use a stable ID based on chart content hash and timestamp to ensure uniqueness
      const chartHash = chart.split("").reduce((acc, char) => {
        // biome-ignore lint/suspicious/noBitwiseOperators: "Required for Mermaid"
        return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
      }, 0);
      const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const { svg } = await mermaid.render(uniqueId, chart);
      // For SVG and PNG, we need to extract the rendered SVG

      if (!svg) {
        props.onError?.(new Error("SVG not found. Please wait for the diagram to render."));
        return;
      }

      const serializedSvg = serializeSvgForDownload(svg);

      if (format === "svg") {
        save(`${baseFilename}.svg`, serializedSvg, "image/svg+xml");
        close();
        props.onDownload?.(format);
        return;
      }

      if (format === "png") {
        const blob = await svgToPngBlob(serializedSvg);
        save(`${baseFilename}.png`, blob, "image/png");
        props.onDownload?.(format);
        close();
        return;
      }
    } catch (error) {
      props.onError?.(error as Error);
    }
  };

  const itemClass = () =>
    cn("w-full px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40");

  return (
    <ui.Menu
      panelClass={cn(
        "min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg"
      )}
      positionClass={cn("absolute end-0 top-full z-10 mt-1")}
      trigger={({ props: trigger }) => (
        <ui.Button
          {...trigger}
          aria-label={t.downloadDiagram}
          class={cn(
            "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
            props.class
          )}
          disabled={context.isAnimating}
          title={t.downloadDiagram}
          type="button"
        >
          {props.children ?? <Dynamic aria-hidden="true" component={icons.DownloadIcon} size={14} />}
        </ui.Button>
      )}
    >
      {(close) => (
        <>
          <ui.MenuItem
            aria-label={t.downloadDiagramAsSvg}
            class={itemClass()}
            onSelect={() => downloadMermaid("svg", close)}
            title={t.downloadDiagramAsSvg}
          >
            {t.mermaidFormatSvg}
          </ui.MenuItem>
          <ui.MenuItem
            aria-label={t.downloadDiagramAsPng}
            class={itemClass()}
            onSelect={() => downloadMermaid("png", close)}
            title={t.downloadDiagramAsPng}
          >
            {t.mermaidFormatPng}
          </ui.MenuItem>
          <ui.MenuItem
            aria-label={t.downloadDiagramAsMmd}
            class={itemClass()}
            onSelect={() => downloadMermaid("mmd", close)}
            title={t.downloadDiagramAsMmd}
          >
            {t.mermaidFormatMmd}
          </ui.MenuItem>
        </>
      )}
    </ui.Menu>
  );
};
