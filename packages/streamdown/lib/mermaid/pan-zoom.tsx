/**
 * Ported from vercel/streamdown packages/streamdown/lib/mermaid/pan-zoom.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { createEffect, createSignal, type JSX, on, onCleanup, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { useTranslations } from "../translations-context";
import { useUi } from "../ui-context";

interface PanZoomProps {
  children: JSX.Element;
  class?: string;
  contentSize?: { height: number; width: number } | null;
  fitKey?: string;
  fullscreen?: boolean;
  initialZoom?: number;
  isAutoFit?: boolean;
  maxZoom?: number;
  minZoom?: number;
  showControls?: boolean;
  zoomStep?: number;
}

const positiveOrNull = (px: number): number | null => (px > 0 ? px : null);

const parseLengthPx = (value: string, element: HTMLElement): number | null => {
  if (value.endsWith("px")) {
    return positiveOrNull(Number.parseFloat(value));
  }

  if (value.endsWith("rem")) {
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize || "16"
    );
    return positiveOrNull(Number.parseFloat(value) * rootFontSize);
  }

  if (value.endsWith("em")) {
    const fontSize = Number.parseFloat(
      getComputedStyle(element).fontSize || "16"
    );
    return positiveOrNull(Number.parseFloat(value) * fontSize);
  }

  if (value.endsWith("vh")) {
    return positiveOrNull(
      (Number.parseFloat(value) / 100) * window.innerHeight
    );
  }

  if (value.endsWith("%")) {
    const parent = element.parentElement;
    if (!(parent && parent.clientHeight > 0)) {
      return null;
    }
    return positiveOrNull(
      (Number.parseFloat(value) / 100) * parent.clientHeight
    );
  }

  return null;
};

/**
 * Resolve CSS max-height to pixels when possible.
 * Returns null when max-height does not constrain the element.
 */
const resolveMaxHeightPx = (
  element: HTMLElement,
  maxHeight: string
): number | null => {
  const value = maxHeight.trim().toLowerCase();
  if (!value || value === "none" || value === "auto") {
    return null;
  }

  return parseLengthPx(value, element);
};

const MIN_MAX_HEIGHT_REGEX = /^min\(\s*([^,]+)\s*,\s*([^)]+)\s*\)$/i;

/**
 * Evaluate simple `min(a, b)` max-height expressions used in Tailwind utilities
 * like `max-h-[min(70vh,40rem)]`.
 */
const resolveComplexMaxHeightPx = (
  element: HTMLElement,
  maxHeight: string
): number | null => {
  const direct = resolveMaxHeightPx(element, maxHeight);
  if (direct != null) {
    return direct;
  }

  const minMatch = maxHeight.trim().match(MIN_MAX_HEIGHT_REGEX);
  if (!minMatch) {
    return null;
  }

  const left = resolveMaxHeightPx(element, minMatch[1].trim());
  const right = resolveMaxHeightPx(element, minMatch[2].trim());
  if (left == null || right == null) {
    return null;
  }
  return Math.min(left, right);
};

const computeFit = (
  contentSize: { height: number; width: number },
  container: HTMLElement,
  fullscreen: boolean
): { fitZoom: number; viewportHeight: number | null } | null => {
  const containerWidth = container.clientWidth;
  if (!(containerWidth > 0)) {
    return null;
  }

  if (fullscreen) {
    const containerHeight = container.clientHeight;
    if (!(containerHeight > 0)) {
      return null;
    }

    const fitZoom = Math.min(
      containerWidth / contentSize.width,
      containerHeight / contentSize.height,
      1
    );

    if (!(fitZoom > 0) || Number.isNaN(fitZoom)) {
      return null;
    }

    return { fitZoom, viewportHeight: null };
  }

  // Fit to container width first so the card never expands past the text column.
  const widthFit = Math.min(containerWidth / contentSize.width, 1);
  if (!(widthFit > 0) || Number.isNaN(widthFit)) {
    return null;
  }

  const heightAtWidthFit = contentSize.height * widthFit;

  // Cap tall diagrams using CSS max-height on this viewport or its parents.
  let maxHeightPx: number | null = null;
  let node: HTMLElement | null = container;
  while (node && maxHeightPx == null) {
    const styles = getComputedStyle(node);
    maxHeightPx = resolveComplexMaxHeightPx(node, styles.maxHeight);
    node = node.parentElement;
  }

  const viewportHeight =
    maxHeightPx != null
      ? Math.min(heightAtWidthFit, maxHeightPx)
      : heightAtWidthFit;

  const fitZoom = Math.min(widthFit, viewportHeight / contentSize.height, 1);

  if (!(fitZoom > 0) || Number.isNaN(fitZoom)) {
    return null;
  }

  return { fitZoom, viewportHeight };
};

export const PanZoom = (props: PanZoomProps) => {
  const icons = useIcons();
  const cn = useCn();
  const ui = useUi();
  const t = useTranslations();
  const minZoom = () => props.minZoom ?? 0.5;
  const maxZoom = () => props.maxZoom ?? 3;
  const zoomStep = () => props.zoomStep ?? 0.1;
  const initialZoom = () => props.initialZoom ?? 1;
  const fullscreen = () => props.fullscreen ?? false;

  let container: HTMLDivElement | undefined;
  let content: HTMLDivElement | undefined;
  let hasUserInteracted = false;
  const [baseZoom, setBaseZoom] = createSignal(initialZoom());
  const [effectiveMinZoom, setEffectiveMinZoom] = createSignal(minZoom());
  const [zoom, setZoom] = createSignal(initialZoom());
  const [pan, setPan] = createSignal({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = createSignal(false);
  let panStart = { x: 0, y: 0 };
  let panStartPosition = { x: 0, y: 0 };
  // Intrinsic height of the viewport once the diagram is scaled to container width.
  // Height is independent of the fitted scale transform so the card doesn't balloon
  // with the SVG's native size. Capped by max-height CSS when tall.
  const [viewportHeight, setViewportHeight] = createSignal<number | null>(null);

  const applyFit = (nextContentSize: { height: number; width: number }) => {
    if (!container) {
      return;
    }

    const result = computeFit(nextContentSize, container, fullscreen());
    if (!result) {
      return;
    }

    setViewportHeight(result.viewportHeight);
    setBaseZoom(result.fitZoom);
    setEffectiveMinZoom(Math.min(minZoom(), result.fitZoom));

    if (!hasUserInteracted) {
      setZoom(result.fitZoom);
      setPan({ x: 0, y: 0 });
    }
  };

  const handleZoom = (delta: number) => {
    setZoom((prevZoom) => Math.max(effectiveMinZoom(), Math.min(maxZoom(), prevZoom + delta)));
    hasUserInteracted = true;
  };

  const handleZoomIn = () => handleZoom(zoomStep());
  const handleZoomOut = () => handleZoom(-zoomStep());

  const handleReset = () => {
    setZoom(baseZoom());
    setPan({ x: 0, y: 0 });
    hasUserInteracted = false;
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY > 0 ? -zoomStep() : zoomStep());
  };

  const handlePointerDown = (e: PointerEvent) => {
    // Only handle primary pointer (left mouse button, first touch, etc.)
    if (e.button !== 0 || e.isPrimary === false) {
      return;
    }
    setIsPanning(true);
    hasUserInteracted = true;
    panStart = { x: e.clientX, y: e.clientY };
    panStartPosition = pan();
    // Capture the pointer to track it even outside the element
    const target = e.currentTarget;
    if (target instanceof HTMLElement) {
      target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    /* v8 ignore next */
    if (!isPanning()) {
      return;
    }
    e.preventDefault();
    setPan({
      x: panStartPosition.x + (e.clientX - panStart.x),
      y: panStartPosition.y + (e.clientY - panStart.y),
    });
  };

  const handlePointerUp = (e: PointerEvent) => {
    setIsPanning(false);
    // Release pointer capture
    const target = e.currentTarget;
    if (target instanceof HTMLElement) {
      target.releasePointerCapture(e.pointerId);
    }
  };

  createEffect(() => {
    setEffectiveMinZoom(minZoom());
    if (!props.isAutoFit) {
      const zoomValue = initialZoom();
      setBaseZoom(zoomValue);
      setZoom(zoomValue);
      setViewportHeight(null);
    }
  });

  // Fit before the user sees the diagram, and again whenever the container
  // resizes (upstream: a layout effect).
  createEffect(() => {
    const contentSize = props.contentSize;
    if (!(props.isAutoFit && contentSize)) {
      return;
    }

    applyFit(contentSize);

    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      applyFit(contentSize);
    });
    observer.observe(container);
    onCleanup(() => observer.disconnect());
  });

  // fitKey is an intentional trigger: new diagram identity should re-enable auto-fit.
  createEffect(
    on(
      () => [props.fitKey, props.isAutoFit],
      () => {
        if (props.isAutoFit) {
          hasUserInteracted = false;
        }
      }
    )
  );

  onMount(() => {
    const element = container;
    /* v8 ignore next */
    if (!element) {
      return;
    }
    element.addEventListener("wheel", handleWheel, { passive: false });
    onCleanup(() => element.removeEventListener("wheel", handleWheel));
  });

  createEffect(() => {
    const element = content;
    /* v8 ignore next */
    if (!(element && isPanning())) {
      return;
    }

    // Prevent text selection while panning
    document.body.style.userSelect = "none";
    element.addEventListener("pointermove", handlePointerMove, { passive: false });
    element.addEventListener("pointerup", handlePointerUp);
    element.addEventListener("pointercancel", handlePointerUp);

    onCleanup(() => {
      document.body.style.userSelect = "";
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("pointercancel", handlePointerUp);
    });
  });

  const viewportStyle = (): JSX.CSSProperties => {
    const height = viewportHeight();
    return !fullscreen() && props.isAutoFit && height != null ? { height: `${height}px` } : {};
  };

  const buttonClass = () =>
    cn(
      "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    );

  return (
    <div
      class={cn("relative flex flex-col", fullscreen() ? "h-full w-full" : "min-h-28 w-full", props.class)}
      ref={container}
      style={{
        cursor: isPanning() ? "grabbing" : "grab",
        ...viewportStyle(),
      }}
    >
      <Show when={props.showControls ?? true}>
        <div
          class={cn(
            "absolute z-10 flex flex-col gap-1 rounded-md border border-border bg-background/80 p-1 supports-[backdrop-filter]:bg-background/70 supports-[backdrop-filter]:backdrop-blur-sm",
            fullscreen() ? "start-4 bottom-4" : "start-2 bottom-2"
          )}
        >
          <ui.Button
            aria-label={t.zoomIn}
            class={buttonClass()}
            disabled={zoom() >= maxZoom()}
            onClick={handleZoomIn}
            title={t.zoomIn}
            type="button"
          >
            <Dynamic aria-hidden="true" component={icons.ZoomInIcon} size={16} />
          </ui.Button>
          <ui.Button
            aria-label={t.zoomOut}
            class={buttonClass()}
            disabled={zoom() <= effectiveMinZoom()}
            onClick={handleZoomOut}
            title={t.zoomOut}
            type="button"
          >
            <Dynamic aria-hidden="true" component={icons.ZoomOutIcon} size={16} />
          </ui.Button>
          <ui.Button
            aria-label={t.resetView}
            class={cn(
              "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            )}
            onClick={handleReset}
            title={t.resetView}
            type="button"
          >
            <Dynamic aria-hidden="true" component={icons.RotateCcwIcon} size={16} />
          </ui.Button>
        </div>
      </Show>
      <div
        class={cn(
          "flex h-full w-full flex-1 origin-center items-center justify-center transition-transform duration-150 ease-out"
        )}
        onPointerDown={handlePointerDown}
        ref={content}
        role="application"
        style={{
          transform: `translate(${pan().x}px, ${pan().y}px) scale(${zoom()})`,
          "transform-origin": "center center",
          "touch-action": "none",
          "will-change": "transform",
        }}
      >
        {props.children}
      </div>
    </div>
  );
};
