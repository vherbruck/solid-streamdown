/**
 * Ported from vercel/streamdown packages/streamdown/index.tsx @ 072ce7e (StreamdownContext and config types extracted)
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type Component, createContext, type JSX } from "solid-js";
import type { MermaidConfig, ThemeInput } from "./plugin-types";
import type { CSVSeparator } from "./table/utils";

export type DownloadControlConfig = boolean | { filename: string };

export type CopyControlConfig =
  | boolean
  | {
      onCopy?: (() => void) | undefined;
      onError?: ((error: Error) => void) | undefined;
    };

export type ControlsConfig =
  | boolean
  | {
      table?:
        | boolean
        | {
            copy?: boolean | undefined;
            csvSeparator?: CSVSeparator | undefined;
            download?: DownloadControlConfig | undefined;
            fullscreen?: boolean | undefined;
          }
        | undefined;
      code?:
        | boolean
        | {
            copy?: CopyControlConfig | undefined;
            download?: DownloadControlConfig | undefined;
          }
        | undefined;
      mermaid?:
        | boolean
        | {
            download?: DownloadControlConfig | undefined;
            copy?: CopyControlConfig | undefined;
            fullscreen?: boolean | undefined;
            panZoom?: boolean | undefined;
          }
        | undefined;
      image?: boolean | { download?: boolean | undefined } | undefined;
    };

export interface LinkSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  url: string;
}

export interface LinkSafetyConfig {
  enabled: boolean;
  onLinkCheck?: ((url: string) => Promise<boolean> | boolean) | undefined;
  renderModal?: ((props: LinkSafetyModalProps) => JSX.Element) | undefined;
}

export interface MermaidErrorComponentProps {
  chart: string;
  error: string;
  retry: () => void;
}

export interface MermaidOptions {
  config?: MermaidConfig | undefined;
  errorComponent?: Component<MermaidErrorComponentProps> | undefined;
}

export type AllowedTags = Record<string, string[]>;
export type PortalTarget = HTMLElement | null | (() => HTMLElement | null);

// Combined context so components read all shared settings from one place.
// Providers build the value with getter fields; consumers read fields lazily.
export interface StreamdownContextType {
  /** Max height for fenced code blocks. @default 400 */
  codeBlockMaxHeight: number | string;
  /** Code fence languages rendered verbatim without highlighting. */
  codeBlockRawLanguages?: string[] | undefined;
  controls: ControlsConfig;
  isAnimating: boolean;
  /** Show line numbers in code blocks. @default true */
  lineNumbers: boolean;
  linkSafety?: LinkSafetyConfig | undefined;
  mermaid?: MermaidOptions | undefined;
  mode: "static" | "streaming";
  portal?: PortalTarget | undefined;
  shikiTheme: [ThemeInput, ThemeInput];
  /** Max height for tables. @default 300 */
  tableMaxHeight: number | string;
}

const DEFAULT_SHIKI_THEME: [ThemeInput, ThemeInput] = [
  "github-light",
  "github-dark",
];

const DEFAULT_LINK_SAFETY_CONFIG: LinkSafetyConfig = {
  enabled: true,
};

export const defaultStreamdownContext: StreamdownContextType = {
  codeBlockMaxHeight: 400,
  shikiTheme: DEFAULT_SHIKI_THEME,
  controls: true,
  isAnimating: false,
  lineNumbers: true,
  mode: "streaming",
  mermaid: undefined,
  linkSafety: DEFAULT_LINK_SAFETY_CONFIG,
  portal: undefined,
  tableMaxHeight: 300,
};

export const StreamdownContext = createContext<StreamdownContextType>(
  defaultStreamdownContext
);
