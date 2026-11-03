/**
 * Ported from vercel/streamdown packages/streamdown/lib/code-block/copy-button.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { createSignal, type JSX, onCleanup, Show, splitProps, useContext } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { useTranslations } from "../translations-context";
import { useUi } from "../ui-context";
import { useCodeBlockContext } from "./context";

export type CodeBlockCopyButtonProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "onCopy" | "onError"
> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = (props: CodeBlockCopyButtonProps & { code?: string }) => {
  const [local, rest] = splitProps(props, [
    "onCopy",
    "onError",
    "timeout",
    "children",
    "class",
    "code",
  ]);
  const cn = useCn();
  const ui = useUi();
  const icons = useIcons();
  const [isCopied, setIsCopied] = createSignal(false);
  const codeBlock = useCodeBlockContext();
  const context = useContext(StreamdownContext);
  const t = useTranslations();
  let timeout = 0;
  onCleanup(() => clearTimeout(timeout));

  const code = () => local.code ?? codeBlock.code;

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      local.onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      if (!isCopied()) {
        await navigator.clipboard.writeText(code());
        setIsCopied(true);
        local.onCopy?.();
        timeout = window.setTimeout(() => setIsCopied(false), local.timeout ?? 2000);
      }
    } catch (error) {
      local.onError?.(error as Error);
    }
  };

  return (
    <>
      <ui.Button
        aria-label={t.copyCode}
        class={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          local.class
        )}
        data-streamdown="code-block-copy-button"
        disabled={context.isAnimating}
        onClick={copyToClipboard}
        title={t.copyCode}
        type="button"
        {...rest}
      >
        {local.children ?? (
          <Dynamic
            aria-hidden="true"
            component={isCopied() ? icons.CheckIcon : icons.CopyIcon}
            size={14}
          />
        )}
      </ui.Button>
      <Show when={isCopied()}>
        <output aria-live="polite" class="sr-only">
          {t.copied}
        </output>
      </Show>
    </>
  );
};
