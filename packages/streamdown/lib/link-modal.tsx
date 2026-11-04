/**
 * Ported from vercel/streamdown packages/streamdown/lib/link-modal.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { createSignal, onCleanup, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useIcons } from "./icon-context";
import { useCn } from "./prefix-context";
import type { LinkSafetyModalProps } from "./streamdown-context";
import { useTranslations } from "./translations-context";
import { useUi } from "./ui-context";

export const LinkSafetyModal = (props: LinkSafetyModalProps) => {
  const icons = useIcons();
  const cn = useCn();
  const ui = useUi();
  const [copied, setCopied] = createSignal(false);
  const t = useTranslations();
  let copiedTimeout: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(copiedTimeout));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.url);
      setCopied(true);
      copiedTimeout = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const handleConfirm = () => {
    props.onConfirm();
    props.onClose();
  };

  return (
    <ui.Overlay label={t.openExternalLink} onClose={() => props.onClose()} open={props.isOpen}>
      {/* biome-ignore lint/a11y/useSemanticElements: "div is used as a backdrop overlay" */}
      <div
        class={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm"
        )}
        data-streamdown="link-safety-modal"
        onClick={() => props.onClose()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            props.onClose();
          }
        }}
        role="button"
        tabIndex={0}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
        <div
          class={cn(
            "relative mx-4 flex w-full max-w-md flex-col gap-4 rounded-xl border bg-background p-6 shadow-lg"
          )}
          onClick={(e) => e.stopPropagation()}
          // A native listener: Solid delegates onKeyDown to the document, where
          // stopping propagation is too late for the overlay's Escape listener.
          on:keydown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <ui.Button
            class={cn(
              "absolute end-4 top-4 rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            )}
            onClick={() => props.onClose()}
            title={t.close}
            type="button"
          >
            <Dynamic component={icons.XIcon} size={16} />
          </ui.Button>

          <div class={cn("flex flex-col gap-2")}>
            <div class={cn("flex items-center gap-2 font-semibold text-lg")}>
              <Dynamic component={icons.ExternalLinkIcon} size={20} />
              <span>{t.openExternalLink}</span>
            </div>
            <p class={cn("text-muted-foreground text-sm")}>{t.externalLinkWarning}</p>
          </div>

          <div
            class={cn(
              "break-all rounded-md bg-muted p-3 font-mono text-sm",
              props.url.length > 100 && "max-h-32 overflow-y-auto"
            )}
          >
            {props.url}
          </div>

          <div class={cn("flex gap-2")}>
            <ui.Button
              class={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 font-medium text-sm transition-all hover:bg-muted"
              )}
              onClick={handleCopy}
              type="button"
            >
              <Show
                fallback={
                  <>
                    <Dynamic component={icons.CopyIcon} size={14} />
                    <span>{t.copyLink}</span>
                  </>
                }
                when={copied()}
              >
                <Dynamic component={icons.CheckIcon} size={14} />
                <span>{t.copied}</span>
              </Show>
            </ui.Button>
            <ui.Button
              class={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-all hover:bg-primary/90"
              )}
              onClick={handleConfirm}
              type="button"
            >
              <Dynamic component={icons.ExternalLinkIcon} size={14} />
              <span>{t.openLink}</span>
            </ui.Button>
          </div>
        </div>
      </div>
    </ui.Overlay>
  );
};
