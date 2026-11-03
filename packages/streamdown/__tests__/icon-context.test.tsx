/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/icon-context.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { type defaultIcons, type IconMap, IconProvider, useIcons } from "../lib/icon-context";

type SvgProps = JSX.SvgSVGAttributes<SVGSVGElement>;

const CustomCheckIcon = (props: SvgProps) => (
  <svg data-testid="custom-check" {...props}>
    <title>Check icon</title>
    <circle r="5" />
  </svg>
);

const IconConsumer = (props: { iconName: keyof typeof defaultIcons }) => {
  const icons = useIcons();
  return <Dynamic component={icons[props.iconName]} data-testid="rendered-icon" />;
};

describe("IconProvider", () => {
  it("provides default icons when no overrides are given", () => {
    const { container } = render(() => (
      <IconProvider>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    ));

    const svg = container.querySelector("[data-testid='rendered-icon']");
    expect(svg).toBeTruthy();
    // Default CheckIcon has a <path> child, not <circle>
    expect(svg?.querySelector("path")).toBeTruthy();
    expect(svg?.querySelector("circle")).toBeFalsy();
  });

  it("overrides a specific icon when provided", () => {
    const { container } = render(() => (
      <IconProvider icons={{ CheckIcon: CustomCheckIcon }}>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    ));

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    // Custom icon renders a <circle>, not a <path>
    expect(svg?.querySelector("circle")).toBeTruthy();
    expect(svg?.querySelector("path")).toBeFalsy();
  });

  it("keeps non-overridden icons as defaults", () => {
    const { container } = render(() => (
      <IconProvider icons={{ CheckIcon: CustomCheckIcon }}>
        <IconConsumer iconName="CopyIcon" />
      </IconProvider>
    ));

    const svg = container.querySelector("[data-testid='rendered-icon']");
    expect(svg).toBeTruthy();
    // CopyIcon should still be the default (has a <path>)
    expect(svg?.querySelector("path")).toBeTruthy();
  });

  it("falls back to defaults when icons prop is undefined", () => {
    const { container } = render(() => (
      <IconProvider icons={undefined}>
        <IconConsumer iconName="DownloadIcon" />
      </IconProvider>
    ));

    const svg = container.querySelector("[data-testid='rendered-icon']");
    expect(svg).toBeTruthy();
    expect(svg?.querySelector("path")).toBeTruthy();
  });
});

// Upstream's "rerender / shallowEqual coverage": the same transitions, driven
// by a signal instead of rerender.
describe("IconProvider with changing icons", () => {
  const renderWith = (initial: Partial<IconMap> | undefined, iconName: keyof IconMap) => {
    const [icons, setIcons] = createSignal(initial);
    const result = render(() => (
      <IconProvider icons={icons()}>
        <IconConsumer iconName={iconName} />
      </IconProvider>
    ));
    return { ...result, setIcons };
  };

  it("updates when icons change to a different component", () => {
    const AltCheckIcon = (props: SvgProps) => (
      <svg data-testid="alt-check" {...props}>
        <title>Alt check</title>
        <rect height="10" width="10" />
      </svg>
    );
    const { container, setIcons } = renderWith({ CheckIcon: CustomCheckIcon }, "CheckIcon");
    expect(container.querySelector("circle")).toBeTruthy();

    setIcons({ CheckIcon: AltCheckIcon });

    expect(container.querySelector("rect")).toBeTruthy();
    expect(container.querySelector("circle")).toBeFalsy();
  });

  it("updates when icons change from an object to undefined", () => {
    const { container, setIcons } = renderWith({ CheckIcon: CustomCheckIcon }, "CheckIcon");
    expect(container.querySelector("circle")).toBeTruthy();

    setIcons(undefined);

    expect(container.querySelector("circle")).toBeFalsy();
    expect(container.querySelector("path")).toBeTruthy();
  });

  it("updates when icons change from undefined to an object", () => {
    const { container, setIcons } = renderWith(undefined, "CheckIcon");
    expect(container.querySelector("path")).toBeTruthy();

    setIcons({ CheckIcon: CustomCheckIcon });

    expect(container.querySelector("circle")).toBeTruthy();
  });

  it("updates when another key is added", () => {
    const AnotherIcon = (props: SvgProps) => (
      <svg {...props}>
        <title>Another</title>
      </svg>
    );
    const { container, setIcons } = renderWith({ CheckIcon: CustomCheckIcon }, "CopyIcon");
    expect(container.querySelector("path")).toBeTruthy();

    setIcons({ CheckIcon: CustomCheckIcon, CopyIcon: AnotherIcon });

    expect(container.querySelector("[data-testid='rendered-icon']")).toBeTruthy();
    expect(container.querySelector("path")).toBeFalsy();
  });

  it("keeps the icon when the same icons reference is passed again", () => {
    const icons = { CheckIcon: CustomCheckIcon };
    const { container, setIcons } = renderWith(icons, "CheckIcon");
    const before = container.querySelector("svg");

    setIcons(icons);

    expect(container.querySelector("circle")).toBeTruthy();
    expect(container.querySelector("svg")).toBe(before);
  });
});

describe("useIcons", () => {
  it("returns default icons outside of a provider", () => {
    const { container } = render(() => <IconConsumer iconName="CheckIcon" />);

    const svg = container.querySelector("[data-testid='rendered-icon']");
    expect(svg).toBeTruthy();
    expect(svg?.querySelector("path")).toBeTruthy();
  });
});

describe("Streamdown icons prop", () => {
  it("provides overrides to components rendered inside Streamdown", () => {
    const Probe = () => <IconConsumer iconName="CheckIcon" />;
    const { container } = render(() => (
      <Streamdown components={{ p: Probe }} icons={{ CheckIcon: CustomCheckIcon }} mode="static">
        {"x"}
      </Streamdown>
    ));
    expect(container.querySelector("circle")).toBeTruthy();
  });

  it("does not forward icons to the root element", () => {
    const { container } = render(() => (
      <Streamdown icons={{ CheckIcon: CustomCheckIcon }} mode="static">
        {"x"}
      </Streamdown>
    ));
    expect(container.firstElementChild?.hasAttribute("icons")).toBe(false);
  });
});
