/**
 * Ported from vercel/streamdown packages/streamdown/index.tsx @ c5e44d8 (StreamdownContext and config types extracted)
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type Component, createContext, type JSX } from "solid-js";
import type { MermaidConfig, ThemeInput } from "./plugin-types";

// TODO(plan 2): import from "./table/utils" once that module is ported.
export type CSVSeparator = "," | ";" | "\t" | "auto";

export type DownloadControlConfig = boolean | { filename: string };

export type CopyControlConfig =
  | boolean
  | {
      onCopy?: () => void;
      onError?: (error: Error) => void;
    };

export type ControlsConfig =
  | boolean
  | {
      table?:
        | boolean
        | {
            copy?: boolean;
            csvSeparator?: CSVSeparator;
            download?: DownloadControlConfig;
            fullscreen?: boolean;
          };
      code?:
        | boolean
        | {
            copy?: CopyControlConfig;
            download?: DownloadControlConfig;
          };
      mermaid?:
        | boolean
        | {
            download?: DownloadControlConfig;
            copy?: CopyControlConfig;
            fullscreen?: boolean;
            panZoom?: boolean;
          };
      image?: boolean | { download?: boolean };
    };

export interface LinkSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  url: string;
}

export interface LinkSafetyConfig {
  enabled: boolean;
  onLinkCheck?: (url: string) => Promise<boolean> | boolean;
  renderModal?: (props: LinkSafetyModalProps) => JSX.Element;
}

export interface MermaidErrorComponentProps {
  chart: string;
  error: string;
  retry: () => void;
}

export interface MermaidOptions {
  config?: MermaidConfig;
  errorComponent?: Component<MermaidErrorComponentProps>;
}

export type AllowedTags = Record<string, string[]>;
export type PortalTarget = HTMLElement | null | (() => HTMLElement | null);

// Combined context so components read all shared settings from one place.
// Providers build the value with getter fields; consumers read fields lazily.
export interface StreamdownContextType {
  /** Max height for fenced code blocks. @default 400 */
  codeBlockMaxHeight: number | string;
  /** Code fence languages rendered verbatim without highlighting. */
  codeBlockRawLanguages?: string[];
  controls: ControlsConfig;
  isAnimating: boolean;
  /** Show line numbers in code blocks. @default true */
  lineNumbers: boolean;
  linkSafety?: LinkSafetyConfig;
  mermaid?: MermaidOptions;
  mode: "static" | "streaming";
  portal?: PortalTarget;
  shikiTheme: [ThemeInput, ThemeInput];
  /** Max height for tables. @default 300 */
  tableMaxHeight: number | string;
}

const defaultShikiTheme: [ThemeInput, ThemeInput] = [
  "github-light",
  "github-dark",
];

const defaultLinkSafetyConfig: LinkSafetyConfig = {
  enabled: true,
};

export const defaultStreamdownContext: StreamdownContextType = {
  codeBlockMaxHeight: 400,
  shikiTheme: defaultShikiTheme,
  controls: true,
  isAnimating: false,
  lineNumbers: true,
  mode: "streaming",
  mermaid: undefined,
  linkSafety: defaultLinkSafetyConfig,
  portal: undefined,
  tableMaxHeight: 300,
};

export const StreamdownContext = createContext<StreamdownContextType>(
  defaultStreamdownContext
);
