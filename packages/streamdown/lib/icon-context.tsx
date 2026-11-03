/**
 * Ported from vercel/streamdown packages/streamdown/lib/icon-context.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type Component, createContext, type JSX, useContext } from "solid-js";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Loader2Icon,
  Maximize2Icon,
  RotateCcwIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./icons";

export type IconComponent = Component<
  JSX.SvgSVGAttributes<SVGSVGElement> & { size?: number }
>;

export interface IconMap {
  CheckIcon: IconComponent;
  CopyIcon: IconComponent;
  DownloadIcon: IconComponent;
  ExternalLinkIcon: IconComponent;
  Loader2Icon: IconComponent;
  Maximize2Icon: IconComponent;
  RotateCcwIcon: IconComponent;
  XIcon: IconComponent;
  ZoomInIcon: IconComponent;
  ZoomOutIcon: IconComponent;
}

export const defaultIcons: IconMap = {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Loader2Icon,
  Maximize2Icon,
  RotateCcwIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
};

export const IconContext = createContext<IconMap>(defaultIcons);

/**
 * Provides the icon map. Each field is a getter that reads `props.icons` when
 * accessed, so swapping overrides at runtime needs no cache: a consumer that
 * renders `<Dynamic component={icons.CheckIcon} />` follows the change.
 */
export const IconProvider = (props: {
  icons?: Partial<IconMap>;
  children: JSX.Element;
}) => {
  const value = {} as IconMap;
  for (const key of Object.keys(defaultIcons) as (keyof IconMap)[]) {
    Object.defineProperty(value, key, {
      enumerable: true,
      get: () => props.icons?.[key] ?? defaultIcons[key],
    });
  }
  return (
    <IconContext.Provider value={value}>{props.children}</IconContext.Provider>
  );
};

export const useIcons = () => useContext(IconContext);
