/**
 * Incomplete Markdown Parser
 *
 * Fixes unterminated markdown syntax during streaming so the parser
 * always receives well-formed input. This is critical for AI chat
 * interfaces where content arrives token-by-token.
 *
 * Adapted from svelte-streamdown by beynar (MIT License)
 * https://github.com/beynar/svelte-streamdown
 *
 * Original concept from Vercel's Streamdown (Apache-2.0)
 * https://github.com/vercel/streamdown
 */

export interface Plugin {
  name: string;
  pattern?: RegExp;
  handler?: (payload: HandlerPayload) => string;
  skipInBlockTypes?: string[];
  preprocess?: (
    payload: HookPayload,
  ) => string | { text: string; state: Partial<ParseState> };
  postprocess?: (payload: HookPayload) => string;
}

interface HookPayload {
  text: string;
  state: ParseState;
  setState: (state: Partial<ParseState>) => void;
}

interface HandlerPayload {
  line: string;
  text: string;
  match: RegExpMatchArray;
  state: ParseState;
  setState: (state: Partial<ParseState>) => void;
}

interface ParseState {
  currentLine: number;
  context: "normal" | "list" | "blockquote";
  blockingContexts: Set<"code" | "math">;
  lineContexts?: Array<{ code: boolean; math: boolean }>;
  fenceInfo?: string;
}

/**
 * Find the end of the current table cell or end of line.
 * Used to insert closing markers at the right position in tables.
 */
function findEndOfCellOrLineContaining(
  line: string,
  position: number,
): number {
  for (let i = position; i < line.length; i++) {
    if (line[i] === "|") return i;
  }
  return line.length;
}

export class IncompleteMarkdownParser {
  private plugins: Plugin[] = [];
  private state: ParseState = {
    currentLine: 0,
    context: "normal",
    blockingContexts: new Set(),
    lineContexts: [],
  };

  setState = (state: Partial<ParseState>) => {
    this.state = { ...this.state, ...state };
  };

  constructor(plugins: Plugin[] = []) {
    this.plugins = plugins;
  }

  parse(text: string): string {
    if (!text || typeof text !== "string") {
      return text;
    }

    this.state = {
      currentLine: 0,
      context: "normal",
      blockingContexts: new Set(),
      lineContexts: [],
      fenceInfo: undefined,
    };

    let result = text;

    // Execute preprocess hooks
    for (const plugin of this.plugins) {
      if (plugin.preprocess) {
        try {
          const preprocessResult = plugin.preprocess({
            text: result,
            state: this.state,
            setState: this.setState,
          });
          if (typeof preprocessResult === "string") {
            result = preprocessResult;
          } else {
            result = preprocessResult.text;
            this.setState(preprocessResult.state);
          }
        } catch (error) {
          console.error(
            `Plugin ${plugin.name} preprocess hook failed:`,
            error,
          );
        }
      }
    }

    // Process each line with each plugin
    const lines = result.split("\n");
    const processedLines = [...lines];

    for (let i = 0; i < processedLines.length; i++) {
      this.state.currentLine = i;
      let line = processedLines[i];

      for (const plugin of this.plugins) {
        const currentLineContext = this.state.lineContexts?.[i];
        const shouldSkip =
          currentLineContext &&
          (plugin.skipInBlockTypes || []).some(
            (blockType) =>
              currentLineContext[blockType as keyof typeof currentLineContext],
          );
        if (shouldSkip) continue;

        try {
          const match = plugin.pattern
            ? line.match(plugin.pattern)
            : line.match(/.*/);
          if (match && plugin.handler) {
            line = plugin.handler({
              line,
              text: line,
              match,
              state: this.state,
              setState: this.setState,
            });
          }
        } catch (error) {
          console.error(`Plugin ${plugin.name} failed on line ${i}:`, error);
        }
      }

      processedLines[i] = line;
    }

    result = processedLines.join("\n");

    // Execute postprocess hooks
    for (const plugin of this.plugins) {
      if (plugin.postprocess) {
        try {
          result = plugin.postprocess({
            text: result,
            state: this.state,
            setState: this.setState,
          });
        } catch (error) {
          console.error(
            `Plugin ${plugin.name} postprocess hook failed:`,
            error,
          );
        }
      }
    }

    return result;
  }

  static createDefaultPlugins(): Plugin[] {
    return [
      // Context manager: tracks code/math blocks across the entire text
      {
        name: "contextManager",
        preprocess: ({ text }) => {
          const lines = text.split("\n");
          let inCodeBlock = false;
          let inMathBlock = false;

          const lineContexts: Array<{ code: boolean; math: boolean }> = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.trim().startsWith("```") || line.trim().startsWith("~~~")) {
              inCodeBlock = !inCodeBlock;
            }
            if (line.trim().startsWith("$$") && !line.trim().includes("$$", 2)) {
              inMathBlock = !inMathBlock;
            }

            lineContexts[i] = {
              code: inCodeBlock,
              math: inMathBlock,
            };
          }

          const finalContexts = new Set<string>();
          if (inCodeBlock) finalContexts.add("code");
          if (inMathBlock) finalContexts.add("math");

          return {
            text,
            state: {
              blockingContexts: finalContexts as Set<"code" | "math">,
              lineContexts,
            },
          };
        },
        postprocess: ({ text, state }) => {
          if (state.blockingContexts.has("code")) {
            return text + "\n```";
          }
          if (state.blockingContexts.has("math")) {
            return text + "\n$$";
          }
          return text;
        },
      },

      // Bold+italic (***) completion
      {
        name: "boldItalic",
        pattern: /\*\*\*/,
        skipInBlockTypes: ["code", "math"],
        handler: ({ line }) => {
          if (line.trim() === "***") return line;
          const tripleAsterisks = (line.match(/\*\*\*/g) || []).length;
          if (tripleAsterisks % 2 === 1) {
            const lastIdx = line.lastIndexOf("***");
            const end = findEndOfCellOrLineContaining(line, lastIdx);
            if (line.endsWith("***")) {
              return line.substring(0, lastIdx);
            }
            return (
              line.substring(0, end) + "***" + line.substring(end)
            );
          }
          return line;
        },
      },

      // Bold (**) completion
      {
        name: "bold",
        pattern: /\*\*/,
        skipInBlockTypes: ["code", "math"],
        handler: ({ line }) => {
          if (line.trim() === "***") return line;
          const count = (line.match(/\*\*/g) || []).length;
          if (count % 2 === 1) {
            const lastIdx = line.lastIndexOf("**");
            const end = findEndOfCellOrLineContaining(line, lastIdx);
            if (line.endsWith("**")) {
              return line.substring(0, lastIdx);
            }
            return line.substring(0, end) + "**" + line.substring(end);
          }
          return line;
        },
      },

      // Double underscore (__) completion
      {
        name: "doubleUnderscoreItalic",
        pattern: /__/,
        skipInBlockTypes: ["code", "math"],
        handler: ({ line }) => {
          if (line.trim() === "___") return line;
          const count = (line.match(/__/g) || []).length;
          if (count % 2 === 1) {
            const lastIdx = line.lastIndexOf("__");
            const end = findEndOfCellOrLineContaining(line, lastIdx);
            if (line.endsWith("__")) {
              return line.substring(0, lastIdx);
            }
            return line.substring(0, end) + "__" + line.substring(end);
          }
          return line;
        },
      },

      // Strikethrough (~~) completion
      {
        name: "strikethrough",
        pattern: /~~/,
        skipInBlockTypes: ["code", "math"],
        handler: ({ line }) => {
          const count = (line.match(/~~/g) || []).length;
          if (count % 2 === 1) {
            const lastIdx = line.lastIndexOf("~~");
            const end = findEndOfCellOrLineContaining(line, lastIdx);
            const contentAfter = line.substring(lastIdx + 2, end);
            if (contentAfter.trim().length > 0) {
              if (line.endsWith("~~")) {
                return line.substring(0, lastIdx);
              }
              return line.substring(0, end) + "~~" + line.substring(end);
            }
          }
          return line;
        },
      },

      // Single asterisk italic (*) completion
      {
        name: "singleAsteriskItalic",
        pattern: /[\s\S]*/,
        skipInBlockTypes: ["code", "math"],
        handler: ({ line }) => {
          if (line.trim() === "***") return line;

          let singleAsterisks = 0;
          for (let i = 0; i < line.length; i++) {
            if (line[i] === "*") {
              const prevChar = i > 0 ? line[i - 1] : "";
              const nextChar = i < line.length - 1 ? line[i + 1] : "";
              // Skip list markers
              let lineStartIndex = 0;
              for (let j = i - 1; j >= 0; j--) {
                if (line[j] === "\n") {
                  lineStartIndex = j + 1;
                  break;
                }
              }
              const beforeAsterisk = line.substring(lineStartIndex, i);
              if (
                beforeAsterisk.trim() === "" &&
                (nextChar === " " || nextChar === "\t")
              ) {
                continue;
              }
              if (prevChar !== "*" && nextChar !== "*") {
                singleAsterisks++;
              }
            }
          }

          if (singleAsterisks % 2 === 1) {
            let firstIdx = -1;
            for (let i = 0; i < line.length; i++) {
              if (
                line[i] === "*" &&
                line[i - 1] !== "*" &&
                line[i + 1] !== "*"
              ) {
                const prevChar = i > 0 ? line[i - 1] : "";
                const nextChar = i < line.length - 1 ? line[i + 1] : "";
                if (/\w/.test(prevChar) && /\w/.test(nextChar)) continue;
                if (/\w/.test(prevChar) && !/\s/.test(prevChar)) continue;
                firstIdx = i;
                break;
              }
            }
            if (firstIdx !== -1) {
              const end = findEndOfCellOrLineContaining(line, firstIdx);
              return line.substring(0, end) + "*" + line.substring(end);
            }
          }
          return line;
        },
      },

      // Inline code (`) completion
      {
        name: "inlineCode",
        skipInBlockTypes: ["code", "math"],
        pattern: /`/,
        handler: ({ line }) => {
          let singleBacktickCount = 0;
          for (let i = 0; i < line.length; i++) {
            if (line[i] === "`") {
              const isTripleStart = line.substring(i, i + 3) === "```";
              const isTripleMiddle =
                i > 0 && line.substring(i - 1, i + 2) === "```";
              const isTripleEnd =
                i > 1 && line.substring(i - 2, i + 1) === "```";
              if (!isTripleStart && !isTripleMiddle && !isTripleEnd) {
                singleBacktickCount++;
              }
            }
          }

          const tripleBackticks = (line.match(/```/g) || []).length;
          const hasCompleteBlock =
            tripleBackticks > 0 &&
            tripleBackticks % 2 === 0 &&
            line.includes("\n");

          if (singleBacktickCount % 2 === 1 && !hasCompleteBlock) {
            const lastIdx = line.lastIndexOf("`");
            const end = findEndOfCellOrLineContaining(line, lastIdx);
            const contentAfter = line.substring(lastIdx + 1, end);
            if (contentAfter.trim().length > 0 && !contentAfter.includes("|")) {
              return line.substring(0, end) + "`" + line.substring(end);
            }
          }
          return line;
        },
      },

      // Single underscore italic (_) completion
      {
        name: "singleUnderscoreItalic",
        pattern: /[\s\S]*/,
        skipInBlockTypes: ["code", "math"],
        handler: ({ line }) => {
          let singleUnderscores = 0;
          for (let i = 0; i < line.length; i++) {
            if (line[i] === "_") {
              const prevChar = i > 0 ? line[i - 1] : "";
              const nextChar = i < line.length - 1 ? line[i + 1] : "";
              if (prevChar === "\\") continue;
              if (
                prevChar &&
                nextChar &&
                /[\p{L}\p{N}_]/u.test(prevChar) &&
                /[\p{L}\p{N}_]/u.test(nextChar)
              ) {
                continue;
              }
              if (prevChar !== "_" && nextChar !== "_") {
                singleUnderscores++;
              }
            }
          }

          if (singleUnderscores % 2 === 1) {
            let firstIdx = -1;
            for (let i = 0; i < line.length; i++) {
              if (
                line[i] === "_" &&
                line[i - 1] !== "_" &&
                line[i + 1] !== "_" &&
                line[i - 1] !== "\\"
              ) {
                const prevChar = i > 0 ? line[i - 1] : "";
                const nextChar = i < line.length - 1 ? line[i + 1] : "";
                if (
                  prevChar &&
                  nextChar &&
                  /[\p{L}\p{N}_]/u.test(prevChar) &&
                  /[\p{L}\p{N}_]/u.test(nextChar)
                ) {
                  continue;
                }
                firstIdx = i;
                break;
              }
            }
            if (firstIdx !== -1) {
              const end = findEndOfCellOrLineContaining(line, firstIdx);
              return line.substring(0, end) + "_" + line.substring(end);
            }
          }
          return line;
        },
      },

      // Links and images completion
      {
        name: "linksAndImages",
        pattern: /(!?\[.*)$/,
        skipInBlockTypes: ["code", "math"],
        handler: ({ line }) => {
          // Incomplete link with URL: [text](url
          const urlMatch = line.match(/(!?\[[^\]]*\]\()([^)]*?)$/);
          if (urlMatch) {
            const url = urlMatch[2];
            if (url.length > 0) {
              let isIncomplete = true;
              if (url.length >= 4) {
                if (
                  (url.startsWith("http://") && url.length >= 12) ||
                  (url.startsWith("https://") && url.length >= 13)
                ) {
                  let domain = url;
                  if (url.startsWith("http://")) domain = url.substring(7);
                  else if (url.startsWith("https://"))
                    domain = url.substring(8);

                  domain = domain.split("/")[0].split("?")[0].split("#")[0];
                  const parts = domain.split(".");
                  if (parts.length >= 2) {
                    const ext = parts[parts.length - 1];
                    if (ext.length >= 2 && /^[a-zA-Z]+$/.test(ext)) {
                      isIncomplete = false;
                    }
                  }
                }
              }

              if (isIncomplete) {
                const marker = urlMatch[1].startsWith("!")
                  ? "streamdown:incomplete-image"
                  : "streamdown:incomplete-link";
                return line.replace(url, marker) + ")";
              } else {
                return line + ")";
              }
            } else {
              const marker = urlMatch[1].startsWith("!")
                ? "streamdown:incomplete-image"
                : "streamdown:incomplete-link";
              return line + marker + ")";
            }
          }

          // Incomplete link without URL: [text
          const linkMatch = line.match(/(!?\[)([^\]]*?)$/);
          if (linkMatch && !line.includes("](")) {
            const [, openBracket, linkText] = linkMatch;
            const bracketIndex = line.lastIndexOf(openBracket);
            const end = findEndOfCellOrLineContaining(line, bracketIndex);
            const cleanText = linkText.replace(/[\s|]+$/, "");
            const marker = openBracket.startsWith("!")
              ? "streamdown:incomplete-image"
              : "streamdown:incomplete-link";

            const includeBoundary =
              end < line.length && line[end] === "|";
            const incompleteEnd = includeBoundary ? end + 1 : end;
            const incompletePart = line.substring(bracketIndex, incompleteEnd);
            const completedPart =
              openBracket +
              cleanText +
              "](" +
              marker +
              ")" +
              (includeBoundary ? "|" : "");

            return line.replace(incompletePart, completedPart);
          }
          return line;
        },
      },
    ];
  }
}

/** Pre-configured parser instance with default plugins */
export function parseIncompleteMarkdown(text: string): string {
  const parser = new IncompleteMarkdownParser(
    IncompleteMarkdownParser.createDefaultPlugins(),
  );
  return parser.parse(text);
}
