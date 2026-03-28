/**
 * Block-level markdown splitting for incremental rendering.
 *
 * Splits markdown into top-level blocks so that during streaming,
 * only the last (active) block needs to be re-parsed. Previous
 * blocks retain stable identity and avoid re-rendering.
 *
 * Adapted from the block-splitting approach in svelte-streamdown
 * by beynar (MIT License) and Vercel's Streamdown (Apache-2.0).
 */

/**
 * Split markdown content into top-level blocks.
 *
 * A "block" is a section separated by blank lines, except inside
 * fenced code blocks, math blocks, or HTML blocks where blank
 * lines are preserved as part of the block content.
 */
export function parseMarkdownIntoBlocks(markdown: string): string[] {
  if (!markdown) return [];

  const lines = markdown.split("\n");
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let inCodeFence = false;
  let codeFenceChar = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track code fence state
    if (!inCodeFence) {
      if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
        inCodeFence = true;
        codeFenceChar = trimmed[0];
        currentBlock.push(line);
        continue;
      }
    } else {
      // Check for closing fence
      if (
        trimmed.startsWith(codeFenceChar.repeat(3)) &&
        trimmed.replace(new RegExp(`^\\${codeFenceChar}+`), "").trim() === ""
      ) {
        inCodeFence = false;
        currentBlock.push(line);
        continue;
      }
      currentBlock.push(line);
      continue;
    }

    // Outside code fences: blank line = block boundary
    if (trimmed === "") {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }

  // Don't forget the last block
  if (currentBlock.length > 0 || inCodeFence) {
    blocks.push(currentBlock.join("\n"));
  }

  return blocks;
}
