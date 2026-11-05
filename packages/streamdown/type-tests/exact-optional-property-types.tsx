/**
 * Ported from vercel/streamdown packages/streamdown/type-tests/exact-optional-property-types.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 *
 * Type-level regression test for `exactOptionalPropertyTypes` support.
 *
 * This file is type-checked with `tsconfig.exact-optional.json`
 * (`bun run test:types`) against the built declarations, with
 * `exactOptionalPropertyTypes` enabled. It is never executed.
 */
import type { JSX } from "solid-js";
import {
  type AnimateOptions,
  type CjkPlugin,
  type CodeHighlighterPlugin,
  type ControlsConfig,
  type CopyControlConfig,
  type CustomRenderer,
  type CustomRendererProps,
  type DiagramPlugin,
  type ExtraProps,
  type HighlightOptions,
  type HighlightResult,
  type HighlightToken,
  type IconMap,
  type LinkSafetyConfig,
  type MarkdownStreamOptions,
  type MathPlugin,
  type MermaidOptions,
  type Options,
  type PluginConfig,
  Streamdown,
  type StreamdownProps,
  type TableCopyDropdownProps,
  type TableDownloadButtonProps,
  type TableDownloadDropdownProps,
  type ThemeRegistrationAny,
  type UiMenuItemProps,
  type UiMenuProps,
  type UiOverlayProps,
  type UiPrimitives,
} from "../dist/index";

interface MessageProps {
  caret?: "block" | "circle";
  class?: string;
  codeBlockMaxHeight?: number | string;
  dir?: "auto" | "ltr" | "rtl";
  isAnimating?: boolean;
  lineNumbers?: boolean;
  mode?: "static" | "streaming";
  parseIncompleteMarkdown?: boolean;
  prefix?: string;
  tableMaxHeight?: number | string;
  text: string;
}

// Forwarding possibly-`undefined` optional props must type-check.
export const Message = (props: MessageProps) => (
  <Streamdown
    caret={props.caret}
    class={props.class}
    codeBlockMaxHeight={props.codeBlockMaxHeight}
    controls={{
      code: { copy: undefined, download: undefined },
      table: { copy: undefined, csvSeparator: undefined },
    }}
    dir={props.dir}
    isAnimating={props.isAnimating}
    lineNumbers={props.lineNumbers}
    linkSafety={{ enabled: true, onLinkCheck: undefined }}
    mermaid={{ config: undefined, errorComponent: undefined }}
    mode={props.mode}
    parseIncompleteMarkdown={props.parseIncompleteMarkdown}
    plugins={{ cjk: undefined, code: undefined, math: undefined }}
    prefix={props.prefix}
    shikiTheme={undefined}
    tableMaxHeight={props.tableMaxHeight}
  >
    {props.text}
  </Streamdown>
);

// Not in upstream: every optional property of the public option and prop
// types accepts `undefined`, not only the ones forwarded above.

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/** The optional properties of `T` that reject an explicit `undefined`. */
type RejectsUndefined<T> = {
  [K in OptionalKeys<T>]-?: { [P in K]: undefined } extends Pick<T, K>
    ? never
    : K;
}[OptionalKeys<T>];

/** Fails to compile, naming the offending keys, unless `T` is `never`. */
type None<T extends never> = T;

type ObjectPart<T> = Extract<T, object>;
type Controls = ObjectPart<ControlsConfig>;

// Solid's own ARIA attribute types and the `data-*` index signature are left
// out: they are not solid-streamdown's to change.
type OwnStreamdownProps = Omit<
  StreamdownProps,
  keyof JSX.AriaAttributes | `data-${string}`
>;

export type Checks = [
  None<RejectsUndefined<OwnStreamdownProps>>,
  None<RejectsUndefined<Options>>,
  None<RejectsUndefined<ExtraProps>>,
  None<RejectsUndefined<Controls>>,
  None<RejectsUndefined<ObjectPart<Controls["table"]>>>,
  None<RejectsUndefined<ObjectPart<Controls["code"]>>>,
  None<RejectsUndefined<ObjectPart<Controls["mermaid"]>>>,
  None<RejectsUndefined<ObjectPart<Controls["image"]>>>,
  None<RejectsUndefined<ObjectPart<CopyControlConfig>>>,
  None<RejectsUndefined<LinkSafetyConfig>>,
  None<RejectsUndefined<MermaidOptions>>,
  None<RejectsUndefined<AnimateOptions>>,
  None<RejectsUndefined<IconMap>>,
  None<RejectsUndefined<PluginConfig>>,
  None<RejectsUndefined<HighlightOptions>>,
  None<RejectsUndefined<HighlightResult>>,
  None<RejectsUndefined<HighlightToken>>,
  None<RejectsUndefined<CodeHighlighterPlugin>>,
  None<RejectsUndefined<DiagramPlugin>>,
  None<RejectsUndefined<MathPlugin>>,
  None<RejectsUndefined<CjkPlugin>>,
  None<RejectsUndefined<CustomRenderer>>,
  None<RejectsUndefined<CustomRendererProps>>,
  None<RejectsUndefined<ThemeRegistrationAny>>,
  None<RejectsUndefined<MarkdownStreamOptions>>,
  None<RejectsUndefined<TableCopyDropdownProps>>,
  None<RejectsUndefined<TableDownloadButtonProps>>,
  None<RejectsUndefined<TableDownloadDropdownProps>>,
  None<RejectsUndefined<UiPrimitives>>,
  None<RejectsUndefined<UiMenuProps>>,
  None<RejectsUndefined<UiMenuItemProps>>,
  None<RejectsUndefined<UiOverlayProps>>,
];
