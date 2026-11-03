/**
 * Ported from vercel/streamdown packages/streamdown/hooks/use-deferred-render.ts @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

/**
 * Default debounce delay in milliseconds before checking if element is still in view
 */
export const DEFERRED_RENDER_DEBOUNCE_DELAY = 300;

/**
 * Default root margin for Intersection Observer
 * Starts rendering when element is 200px away from viewport
 */
export const DEFERRED_RENDER_ROOT_MARGIN = "300px";

/**
 * Default timeout for requestIdleCallback in milliseconds
 */
export const DEFERRED_RENDER_IDLE_TIMEOUT = 500;

export interface DeferredRenderOptions {
  /**
   * Debounce delay in milliseconds before checking if still in view
   * @default DEFERRED_RENDER_DEBOUNCE_DELAY
   */
  debounceDelay?: number;
  /**
   * Timeout for requestIdleCallback in milliseconds
   * @default DEFERRED_RENDER_IDLE_TIMEOUT
   */
  idleTimeout?: number;
  /**
   * If true, render immediately without waiting for intersection
   * @default false
   */
  immediate?: boolean;
  /**
   * Root margin for Intersection Observer (e.g., '200px' to start rendering 200px before entering viewport)
   * @default DEFERRED_RENDER_ROOT_MARGIN
   */
  rootMargin?: string;
}

// Polyfill for requestIdleCallback
const requestIdleCallbackPolyfill = (callback: IdleRequestCallback): number => {
  const start = Date.now();
  return window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    });
  }, 1);
};

const requestIdle = (cb: IdleRequestCallback, opts?: IdleRequestOptions): number =>
  typeof window !== "undefined" && window.requestIdleCallback
    ? window.requestIdleCallback(cb, opts)
    : requestIdleCallbackPolyfill(cb);

const cancelIdle = (id: number): void => {
  if (typeof window !== "undefined" && window.cancelIdleCallback) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

/**
 * Defers rendering a component until it enters the viewport.
 * Uses Intersection Observer + debounce + requestIdleCallback for optimal performance.
 *
 * Options are read inside an effect, so a props object (or any object with
 * getters) keeps them reactive. Nothing runs on the server, where
 * `shouldRender` stays false unless `immediate` is set.
 *
 * @example
 * ```tsx
 * const { shouldRender, containerRef } = createDeferredRender({ immediate: false });
 *
 * return (
 *   <div ref={containerRef}>
 *     <Show when={shouldRender()}><ExpensiveComponent /></Show>
 *   </div>
 * );
 * ```
 */
export function createDeferredRender(options: DeferredRenderOptions = {}): {
  shouldRender: Accessor<boolean>;
  containerRef: (element: HTMLElement) => void;
} {
  const [shouldRender, setShouldRender] = createSignal(Boolean(options.immediate));
  const [container, setContainer] = createSignal<HTMLElement>();

  createEffect(() => {
    // If immediate, render right away
    if (options.immediate) {
      setShouldRender(true);
      return;
    }

    // Once rendering is due, stop observing (upstream disconnects then too).
    // A component that moves the ref to another element must not restart it.
    if (shouldRender()) {
      return;
    }

    const element = container();
    /* v8 ignore next */
    if (!element) {
      return;
    }

    const debounceDelay = options.debounceDelay ?? DEFERRED_RENDER_DEBOUNCE_DELAY;
    const rootMargin = options.rootMargin ?? DEFERRED_RENDER_ROOT_MARGIN;
    const idleTimeout = options.idleTimeout ?? DEFERRED_RENDER_IDLE_TIMEOUT;

    let renderTimeout: number | null = null;
    let idleCallback: number | null = null;

    const clearPendingRenders = () => {
      if (renderTimeout) {
        clearTimeout(renderTimeout);
        renderTimeout = null;
      }
      if (idleCallback) {
        cancelIdle(idleCallback);
        idleCallback = null;
      }
    };

    const scheduleRender = (obs: IntersectionObserver) => {
      idleCallback = requestIdle(
        (deadline) => {
          // If we have time remaining or it's urgent, render
          if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
            setShouldRender(true);
            obs.disconnect();
          } else {
            // Otherwise, schedule again with shorter timeout
            idleCallback = requestIdle(
              () => {
                setShouldRender(true);
                obs.disconnect();
              },
              { timeout: idleTimeout / 2 }
            );
          }
        },
        { timeout: idleTimeout }
      );
    };

    const handleIntersecting = (obs: IntersectionObserver) => {
      clearPendingRenders();

      // Debounce rendering: wait for debounceDelay, then check if still in view
      renderTimeout = window.setTimeout(() => {
        // Re-check if element is still in viewport using observer records
        const records = obs.takeRecords();
        // If no records, element hasn't changed state (still intersecting)
        // If records exist, check the latest intersection state
        const isStillInView = records.length === 0 || (records.at(-1)?.isIntersecting ?? false);

        if (isStillInView) {
          scheduleRender(obs);
        }
      }, debounceDelay);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            handleIntersecting(observer);
          } else {
            clearPendingRenders();
          }
        }
      },
      {
        rootMargin,
        threshold: 0,
      }
    );

    observer.observe(element);

    onCleanup(() => {
      clearPendingRenders();
      observer.disconnect();
    });
  });

  return {
    shouldRender,
    containerRef: setContainer,
  };
}
