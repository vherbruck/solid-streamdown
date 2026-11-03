/**
 * Ported from vercel/streamdown packages/streamdown/lib/mermaid/index.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import {
  createEffect,
  createSignal,
  Match,
  onCleanup,
  onMount,
  Switch,
  untrack,
  useContext,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { createDeferredRender } from "../../hooks/use-deferred-render";
import { useIsCodeFenceIncomplete } from "../block-incomplete-context";
import { useMermaidPlugin } from "../plugin-context";
import type { DiagramPlugin, MermaidConfig } from "../plugin-types";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { useTranslations } from "../translations-context";
import { PanZoom } from "./pan-zoom";
import { getMermaidSvgSize, normalizeMermaidInlineSvg } from "./utils";

interface MermaidProps {
  chart: string;
  class?: string;
  config?: MermaidConfig;
  fullscreen?: boolean;
  showControls?: boolean;
}

// Resolves after `ms`, or as soon as the function handed to `onWake` is called
const pause = (ms: number, onWake: (wake: () => void) => void) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    onWake(() => {
      clearTimeout(timer);
      resolve();
    });
  });

interface RenderRequest {
  chart: string;
  config?: MermaidConfig;
  /**
   * The plugin current when the request was made. A plugin swapped while a
   * render is in flight applies to the next render (upstream keeps rendering
   * with the plugin the loop started with).
   */
  plugin: DiagramPlugin;
}

type RenderOutcome =
  | { ok: true; svg: string; size: { height: number; width: number } | null }
  | { ok: false; error: string };

const renderChart = async (
  { chart, config, plugin }: RenderRequest,
  fullscreen: boolean,
  fallbackError: string
): Promise<RenderOutcome> => {
  try {
    // Get mermaid instance from plugin
    const mermaid = plugin.getMermaid(config);

    // Use a stable ID based on chart content hash and timestamp to ensure uniqueness
    const chartHash = chart.split("").reduce((acc, char) => {
      // biome-ignore lint/suspicious/noBitwiseOperators: "Required for Mermaid"
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const { svg } = await mermaid.render(uniqueId, chart);
    const size = getMermaidSvgSize(svg);
    return {
      ok: true,
      svg: fullscreen ? svg : normalizeMermaidInlineSvg(svg),
      size,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : fallbackError,
    };
  }
};

export const Mermaid = (props: MermaidProps) => {
  const cn = useCn();
  const t = useTranslations();
  const context = useContext(StreamdownContext);
  const mermaidPlugin = useMermaidPlugin();
  const isStreaming = useIsCodeFenceIncomplete();
  const fullscreen = () => props.fullscreen ?? false;

  const [error, setError] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [svgContent, setSvgContent] = createSignal("");
  const [svgSize, setSvgSize] = createSignal<{ height: number; width: number } | null>(null);
  const [lastValidSvg, setLastValidSvg] = createSignal("");
  const [retryCount, setRetryCount] = createSignal(0);

  // Deferred until the diagram nears the viewport (immediate in fullscreen)
  const { shouldRender, containerRef } = createDeferredRender({
    get immediate() {
      return fullscreen();
    },
  });

  // Mermaid runs renders one after another. While a chart streams, every
  // token used to queue another full parse and layout of the growing chart,
  // so the finished diagram appeared long after the stream ended. Only one
  // render runs at a time here; when it settles, the latest chart is rendered
  // if it changed meanwhile, and the ones in between are skipped.
  let latestRequest: RenderRequest | null = null;
  let inFlight = false;
  let mounted = false;
  let streaming = untrack(isStreaming);
  let wake: (() => void) | null = null;

  onMount(() => {
    mounted = true;
  });
  onCleanup(() => {
    mounted = false;
    wake?.();
  });

  // Once the fence is closed (or the stream stopped) the chart is final, so
  // a pause that is still running must not delay the last render
  createEffect(() => {
    streaming = isStreaming();
    if (!streaming) {
      wake?.();
    }
  });

  const pauseWhileStreaming = async (ms: number) => {
    if (!streaming) {
      return;
    }
    await pause(ms, (wakeUp) => {
      wake = wakeUp;
    });
    wake = null;
  };

  createEffect(() => {
    const chart = props.chart;
    const config = props.config;
    retryCount();
    const plugin = mermaidPlugin();

    // Only render when shouldRender is true
    if (!shouldRender()) {
      return;
    }

    // If no mermaid plugin, show error
    if (!plugin) {
      setError(
        "Mermaid plugin not available. Please add the mermaid plugin to enable diagram rendering."
      );
      return;
    }

    latestRequest = { chart, config, plugin };
    if (inFlight) {
      // The running loop picks up the latest request when it settles
      return;
    }

    untrack(() => renderLatest());
  });

  const commit = (request: RenderRequest, rendered: RenderOutcome) => {
    if (rendered.ok) {
      // Update both current and last valid SVG
      setSvgContent(rendered.svg);
      setSvgSize(rendered.size);
      setLastValidSvg(rendered.svg);
    } else if (request === latestRequest) {
      // Keep the last valid SVG; the error only shows when there is
      // nothing to display, and only for the latest chart
      setError(rendered.error);
    }
  };

  const renderLatest = async () => {
    inFlight = true;
    setError(null);
    setIsLoading(true);
    try {
      let request = latestRequest;
      while (request) {
        const startedAt = performance.now();
        const rendered = await renderChart(request, fullscreen(), t.errorMermaid);
        if (!mounted) {
          return;
        }
        commit(request, rendered);
        // Mermaid lays out on the main thread. While the fence streams,
        // yield after a layout for as long as it took so streamed updates
        // keep flowing at their own pace and only the latest chart is
        // rendered next. A failed parse did no layout, so there is nothing
        // to yield for.
        if (rendered.ok) {
          await pauseWhileStreaming(performance.now() - startedAt);
        }
        if (!mounted || request === latestRequest) {
          return;
        }
        request = latestRequest;
      }
    } finally {
      inFlight = false;
      if (mounted) {
        setIsLoading(false);
      }
    }
  };

  // Always render the SVG if we have content (either current or last valid)
  const displaySvg = () => svgContent() || lastValidSvg();
  const retry = () => setRetryCount((count) => count + 1);

  return (
    <Switch
      fallback={
        <div
          class={cn(fullscreen() ? "size-full" : "max-h-[min(70vh,40rem)] w-full", props.class)}
          data-streamdown="mermaid"
          ref={containerRef}
        >
          <PanZoom
            class={cn(
              fullscreen() ? "size-full overflow-hidden" : "max-h-[min(70vh,40rem)] overflow-hidden",
              props.class
            )}
            contentSize={svgSize()}
            fitKey={props.chart}
            fullscreen={fullscreen()}
            isAutoFit={true}
            maxZoom={3}
            minZoom={0.1}
            showControls={props.showControls ?? true}
            zoomStep={0.1}
          >
            {/* The one place core inserts markup: the SVG the diagram
                plugin rendered (spec, named raw-HTML exception). Mermaid's
                default securityLevel is "strict". */}
            <div
              aria-label={t.mermaidAriaLabel}
              class={cn("flex justify-center", fullscreen() ? "size-full items-center" : null)}
              innerHTML={displaySvg()}
              role="img"
            />
          </PanZoom>
        </div>
      }
    >
      {/* Show placeholder when not scheduled to render */}
      <Match when={!(shouldRender() || displaySvg())}>
        <div class={cn("my-4 min-h-[200px]", props.class)} ref={containerRef} />
      </Match>
      <Match when={isLoading() && !displaySvg()}>
        <div class={cn("my-4 flex justify-center p-4", props.class)} ref={containerRef}>
          <div class={cn("flex items-center space-x-2 text-muted-foreground")}>
            <div class={cn("h-4 w-4 animate-spin rounded-full border-current border-b-2")} />
            <span class={cn("text-sm")}>Loading diagram...</span>
          </div>
        </div>
      </Match>
      {/* Only show error if we have no valid SVG to display */}
      <Match when={error() && !displaySvg()}>
        <Switch
          fallback={
            <div class={cn("rounded-md bg-red-50 p-4", props.class)} ref={containerRef}>
              <p class={cn("font-mono text-red-700 text-sm")}>Mermaid Error: {error()}</p>
              <details class={cn("mt-2")}>
                <summary class={cn("cursor-pointer text-red-600 text-xs")}>Show Code</summary>
                <pre
                  class={cn("mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs")}
                >
                  {props.chart}
                </pre>
              </details>
            </div>
          }
        >
          <Match when={context.mermaid?.errorComponent}>
            {(ErrorComponent) => (
              <div ref={containerRef}>
                <Dynamic
                  chart={props.chart}
                  component={ErrorComponent()}
                  error={error() ?? ""}
                  retry={retry}
                />
              </div>
            )}
          </Match>
        </Switch>
      </Match>
    </Switch>
  );
};
