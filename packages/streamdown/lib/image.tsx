/**
 * Ported from vercel/streamdown packages/streamdown/lib/image.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { INCOMPLETE_IMAGE_PLACEHOLDER } from "remend";
import { createSignal, type JSX, onMount, Show, splitProps, useContext } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useIcons } from "./icon-context";
import type { ExtraProps } from "./markdown";
import { PhrasingContext } from "./phrasing-context";
import { useCn } from "./prefix-context";
import { useTranslations } from "./translations-context";
import { useUi } from "./ui-context";
import { save } from "./utils";

const FILE_EXTENSION_PATTERN = /\.[^/.]+$/;

type ImageComponentProps = Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, "onLoad" | "onError"> &
  ExtraProps & {
    onLoad?: (event: Event) => void;
    onError?: (event: Event) => void;
    showControls?: boolean;
    showDownloadControl?: boolean;
  };

export const ImageComponent = (props: ImageComponentProps) => {
  // `children` stays out of the <img> spread: the server ignores children of
  // a void element, but the client's spread would still create the
  // renderer's (empty) child components, and creating components the server
  // did not shifts every later hydration key in this template.
  const [local, rest] = splitProps(props, [
    "children",
    "node",
    "class",
    "src",
    "alt",
    "onLoad",
    "onError",
    "showControls",
    "showDownloadControl",
  ]);
  const icons = useIcons();
  const cn = useCn();
  // Inside a paragraph (an image beside text) the wrapper must be phrasing
  // content: spans with the same classes. Upstream renders divs, which the
  // HTML parser moves out of the <p>, breaking server-rendered hydration.
  const box = useContext(PhrasingContext) ? "span" : "div";
  const ui = useUi();
  const t = useTranslations();
  let imgRef: HTMLImageElement | undefined;
  const [imageLoaded, setImageLoaded] = createSignal(false);
  const [imageError, setImageError] = createSignal(false);

  const showControls = () => local.showControls ?? true;
  const hasExplicitDimensions = () => props.width != null || props.height != null;
  const canDownload = () => (imageLoaded() || hasExplicitDimensions()) && !imageError();
  const showDownload = () =>
    canDownload() && showControls() && (local.showDownloadControl ?? true);
  const showFallback = () => imageError() && !hasExplicitDimensions();

  // Handle images already complete before the handlers were attached (e.g.
  // cached, or server-rendered and then hydrated)
  onMount(() => {
    if (imgRef?.complete) {
      const loaded = imgRef.naturalWidth > 0;
      setImageLoaded(loaded);
      setImageError(!loaded);
    }
  });

  const handleLoad = (event: Event) => {
    setImageLoaded(true);
    setImageError(false);
    local.onLoad?.(event);
  };

  const handleError = (event: Event) => {
    setImageLoaded(false);
    setImageError(true);
    local.onError?.(event);
  };

  const downloadImage = async () => {
    const src = local.src;
    /* v8 ignore next */
    if (!src) {
      return;
    }

    try {
      const response = await fetch(src);
      const blob = await response.blob();

      // Extract filename from URL or use alt text with proper extension
      const urlPath = new URL(src, window.location.origin).pathname;
      const originalFilename = urlPath.split("/").pop() || "";
      const extension = originalFilename.split(".").pop();
      const hasExtension =
        originalFilename.includes(".") && extension !== undefined && extension.length <= 4;

      let filename = "";

      if (hasExtension) {
        filename = originalFilename;
      } else {
        // Determine extension from blob type
        const mimeType = blob.type;
        let fileExtension = "png"; // default

        if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
          fileExtension = "jpg";
        } else if (mimeType.includes("png")) {
          fileExtension = "png";
        } else if (mimeType.includes("svg")) {
          fileExtension = "svg";
        } else if (mimeType.includes("gif")) {
          fileExtension = "gif";
        } else if (mimeType.includes("webp")) {
          fileExtension = "webp";
        }

        const baseName = local.alt || originalFilename || "image";
        filename = `${baseName.replace(FILE_EXTENSION_PATTERN, "")}.${fileExtension}`;
      }

      save(filename, blob, blob.type);
    } catch {
      // CORS fallback: open image in new tab for manual save
      window.open(src, "_blank");
    }
  };

  return (
    <Show when={local.src}>
      <Show
        fallback={
          <Dynamic
            class={cn("group relative my-4 inline-block")}
            component={box}
            data-streamdown="image-wrapper"
          >
            {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: image overlay with intentional load/error handling */}
            <img
              {...rest}
              alt={local.alt}
              class={cn("max-w-full rounded-lg", showFallback() && "hidden", local.class)}
              data-streamdown="image"
              onError={handleError}
              onLoad={handleLoad}
              ref={imgRef}
              src={local.src}
            />
            <Show when={showFallback()}>
              <span class={cn("text-muted-foreground text-xs italic")} data-streamdown="image-fallback">
                {t.imageNotAvailable}
              </span>
            </Show>
            <Show when={showControls()}>
              <Dynamic
                class={cn(
                  "pointer-events-none absolute inset-0 hidden rounded-lg bg-black/10 group-hover:block"
                )}
                component={box}
                data-streamdown="image-overlay"
              />
            </Show>
            <Show when={showDownload()}>
              <ui.Button
                class={cn(
                  "absolute end-2 bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-background",
                  "opacity-0 group-hover:opacity-100"
                )}
                onClick={downloadImage}
                title={t.downloadImage}
                type="button"
              >
                <Dynamic component={icons.DownloadIcon} size={14} />
              </ui.Button>
            </Show>
          </Dynamic>
        }
        when={local.src === INCOMPLETE_IMAGE_PLACEHOLDER}
      >
        <Dynamic
          class={cn("group relative my-4 inline-block")}
          component={box}
          data-incomplete="true"
          data-streamdown="image-wrapper"
        >
          <Dynamic
            class={cn("h-24 w-48 animate-pulse rounded-lg bg-muted")}
            component={box}
            data-streamdown="image-placeholder"
            // A span ignores width and height unless it is a block
            {...(box === "span" ? { style: { display: "block" } } : {})}
          />
        </Dynamic>
      </Show>
    </Show>
  );
};
