import { stringify as commas } from "comma-separated-tokens";
import type { Element } from "hast";
import { urlAttributes } from "html-url-attributes";
import { find, html, svg } from "property-information";
import { stringify as spaces } from "space-separated-tokens";
import parseStyle from "style-to-object";

/** The namespace an element is created in; MathML uses the HTML property schema. */
type Space = "html" | "svg" | "math";

const RESERVED_NAMES = new Set([
  "innerhtml",
  "textcontent",
  "innertext",
  "outerhtml",
  "ref",
  "classlist",
  "component",
  "children",
  "is",
]);

const ALIGN_VALUES = new Set(["left", "right", "center", "justify"]);

// Matches ASCII whitespace and control characters (U+0000-U+0020, U+007F).
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional
const STRIPPED_CHARS = /[\u0000- \u007F]/g;
const DANGEROUS_SCHEME = /^(?:javascript|vbscript):/;

const isBlockedElement = (tagName: string): boolean => tagName.toLowerCase() === "script";

const isBlockedName = (name: string): boolean => {
  const lower = name.toLowerCase();
  // Solid turns kebab-case names on custom elements into camelCase properties
  // (inner-h-t-m-l -> innerHTML), so compare with dashes removed as well.
  const squashed = lower.replaceAll("-", "");
  return (
    lower.startsWith("on") ||
    squashed.startsWith("on") ||
    lower.includes(":") ||
    RESERVED_NAMES.has(lower) ||
    RESERVED_NAMES.has(squashed)
  );
};

// urlAttributes is keyed by HAST property name (formAction); we look up by
// lower-cased attribute name (formaction), so index it that way once.
const URL_ATTRIBUTES = new Map(
  Object.entries(urlAttributes).map(([key, elements]) => [key.toLowerCase(), elements])
);

// React 19 checks these for a javascript: URL on every element, whatever the
// tag (xlink:href is already dropped for its `:`).
const URL_ATTRIBUTES_ON_ANY_TAG = new Set(["href", "src", "action", "formaction"]);

const isUrlAttribute = (name: string, tagName: string): boolean => {
  const lower = name.toLowerCase();
  if (URL_ATTRIBUTES_ON_ANY_TAG.has(lower)) {
    return true;
  }
  const elements = URL_ATTRIBUTES.get(lower);
  return elements !== undefined && (elements === null || elements.includes(tagName));
};

const hasDangerousScheme = (value: string): boolean =>
  DANGEROUS_SCHEME.test(value.replace(STRIPPED_CHARS, "").toLowerCase());

const toStyleObject = (value: string): Record<string, string> | undefined => {
  try {
    return parseStyle(value) ?? undefined;
  } catch {
    return undefined;
  }
};

const toPlainStyleObject = (value: unknown): Record<string, string> | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const style: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      style[key] = entry;
    } else if (typeof entry === "number" && Number.isFinite(entry)) {
      style[key] = String(entry);
    } else {
      return undefined;
    }
  }
  return style;
};

const toSolidProps = (element: Element, space: Space): Record<string, unknown> => {
  const schema = space === "svg" ? svg : html;
  const tagName = element.tagName.toLowerCase();
  const result: Record<string, unknown> = {};
  let alignStyle: string | undefined;

  for (const [key, raw] of Object.entries(element.properties ?? {})) {
    if (raw === null || raw === undefined || raw === false) {
      continue;
    }
    if (typeof raw === "number" && Number.isNaN(raw)) {
      continue;
    }

    const info = find(schema, key);
    const name = info.attribute;

    // Check both the original key and the mapped name; unknown names map to themselves.
    if (isBlockedName(key) || isBlockedName(name)) {
      continue;
    }

    if (name === "align" && (tagName === "td" || tagName === "th")) {
      if (typeof raw === "string" && ALIGN_VALUES.has(raw.toLowerCase())) {
        alignStyle = raw.toLowerCase();
      }
      continue;
    }

    let value: unknown = raw;
    if (Array.isArray(raw)) {
      value = info.commaSeparated ? commas(raw) : spaces(raw);
    }

    if (name === "style") {
      // Markdown-derived HAST carries string styles. A plugin may set an
      // object (upstream's render animate plugin does); it reaches Solid as
      // an object too, applied per property, and only with plain values.
      const style = typeof value === "string" ? toStyleObject(value) : toPlainStyleObject(value);
      if (style) {
        result.style = style;
      }
      continue;
    }

    result[name] = value;
  }

  if (alignStyle) {
    const existing = result.style;
    result.style = {
      ...(typeof existing === "object" && existing !== null ? existing : {}),
      "text-align": alignStyle,
    };
  }

  // Guard runs last so no mapping step can reintroduce a blocked name.
  for (const [name, value] of Object.entries(result)) {
    if (
      isBlockedName(name) ||
      (typeof value === "string" && isUrlAttribute(name, tagName) && hasDangerousScheme(value))
    ) {
      delete result[name];
    }
  }

  return result;
};

/**
 * Applies the render guard to attributes that come from a plugin rather than
 * from HAST (e.g. a highlighter's per-token `htmlAttrs`): drops blocked names
 * and dangerous URLs.
 */
const guardAttributes = (
  attributes: Record<string, string> | undefined,
  tagName = "span"
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(attributes ?? {})) {
    if (isBlockedName(name)) {
      continue;
    }
    if (isUrlAttribute(name, tagName) && hasDangerousScheme(value)) {
      continue;
    }
    result[name] = value;
  }
  return result;
};

export type { Space };
export { guardAttributes, isBlockedElement, toSolidProps };
