/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/translations.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import {
  defaultTranslations,
  TranslationsContext,
  useTranslations,
} from "../lib/translations-context";

describe("defaultTranslations", () => {
  it("should export defaultTranslations with all required keys", () => {
    expect(defaultTranslations.copyCode).toBe("Copy Code");
    expect(defaultTranslations.downloadFile).toBe("Download file");
    expect(defaultTranslations.downloadDiagram).toBe("Download diagram");
    expect(defaultTranslations.downloadDiagramAsSvg).toBe(
      "Download diagram as SVG"
    );
    expect(defaultTranslations.downloadDiagramAsPng).toBe(
      "Download diagram as PNG"
    );
    expect(defaultTranslations.downloadDiagramAsMmd).toBe(
      "Download diagram as MMD"
    );
    expect(defaultTranslations.viewFullscreen).toBe("View fullscreen");
    expect(defaultTranslations.exitFullscreen).toBe("Exit fullscreen");
    expect(defaultTranslations.mermaidFormatSvg).toBe("SVG");
    expect(defaultTranslations.mermaidFormatPng).toBe("PNG");
    expect(defaultTranslations.mermaidFormatMmd).toBe("MMD");
    expect(defaultTranslations.copyTable).toBe("Copy table");
    expect(defaultTranslations.copyTableAsMarkdown).toBe(
      "Copy table as Markdown"
    );
    expect(defaultTranslations.copyTableAsCsv).toBe("Copy table as CSV");
    expect(defaultTranslations.copyTableAsTsv).toBe("Copy table as TSV");
    expect(defaultTranslations.downloadTable).toBe("Download table");
    expect(defaultTranslations.downloadTableAsCsv).toBe(
      "Download table as CSV"
    );
    expect(defaultTranslations.downloadTableAsMarkdown).toBe(
      "Download table as Markdown"
    );
    expect(defaultTranslations.tableFormatMarkdown).toBe("Markdown");
    expect(defaultTranslations.tableFormatCsv).toBe("CSV");
    expect(defaultTranslations.tableFormatTsv).toBe("TSV");
    expect(defaultTranslations.imageNotAvailable).toBe("Image not available");
    expect(defaultTranslations.downloadImage).toBe("Download image");
    expect(defaultTranslations.openExternalLink).toBe("Open external link?");
    expect(defaultTranslations.externalLinkWarning).toBe(
      "You're about to visit an external website."
    );
    expect(defaultTranslations.close).toBe("Close");
    expect(defaultTranslations.copyLink).toBe("Copy link");
    expect(defaultTranslations.copied).toBe("Copied");
    expect(defaultTranslations.openLink).toBe("Open link");
  });
});

describe("TranslationsContext", () => {
  it("should be accessible from TranslationsContext directly", () => {
    let capturedTranslations: string | undefined;

    const TestConsumer = () => {
      capturedTranslations = useTranslations().copyCode;
      return null;
    };

    render(() => <TestConsumer />);
    expect(capturedTranslations).toBe("Copy Code");
  });

  it("should provide custom values via TranslationsContext.Provider", () => {
    let capturedValue: string | undefined;

    const TestConsumer = () => {
      capturedValue = useTranslations().copyCode;
      return null;
    };

    render(() => (
      <TranslationsContext.Provider
        value={{ ...defaultTranslations, copyCode: "Custom Copy" }}
      >
        <TestConsumer />
      </TranslationsContext.Provider>
    ));

    expect(capturedValue).toBe("Custom Copy");
  });
});
