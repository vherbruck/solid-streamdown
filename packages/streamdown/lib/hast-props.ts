import { stringify as commas } from "comma-separated-tokens";
import type { Element } from "hast";
import { urlAttributes } from "html-url-attributes";
import { find, html, svg } from "property-information";
import { stringify as spaces } from "space-separated-tokens";
import parseStyle from "style-to-object";

type Space = "html" | "svg";

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
  return lower.startsWith("on") || lower.includes(":") || RESERVED_NAMES.has(lower);
};

const isUrlAttribute = (name: string, tagName: string): boolean => {
  if (!Object.hasOwn(urlAttributes, name)) {
    return false;
  }
  const elements = urlAttributes[name];
  return elements === null || elements.includes(tagName);
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
      if (typeof value !== "string") {
        continue;
      }
      const style = toStyleObject(value);
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

export type { Space };
export { isBlockedElement, toSolidProps };
