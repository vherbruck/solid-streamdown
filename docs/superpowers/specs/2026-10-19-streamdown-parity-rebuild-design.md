# solid-streamdown 2.0: Streamdown parity rebuild

- **Date:** 2026-10-19
- **Status:** Approved by owner 2026-10-21
- **Upstream baseline:** `vercel/streamdown` @ `c5e44d8` (2026-10-21), i.e. `streamdown` 2.7.1 plus unreleased `codeBlockRawLanguages` (#614), RTL logical classes (#654) and custom-tag fence fix (#684); `remend` 1.4.0, `@streamdown/code` 2.0.0, `@streamdown/math` 1.0.3, `@streamdown/mermaid` 1.0.3, `@streamdown/cjk` 1.0.4

## Intent

solid-streamdown 1.0.1 is a thin SolidJS port of an early Streamdown: GFM, a hand-ported incomplete-markdown fixer, a blank-line block splitter, a CSS caret, and component overrides (~850 lines). Upstream Streamdown has since become a ~10.7k-line React library plus a standalone repair package (`remend`) and four plugin packages: Shiki code highlighting, KaTeX math, Mermaid diagrams, CJK text handling. It also gained sanitization, link safety, copy/download/fullscreen controls, streaming animation, RTL, i18n, and more.

The owner's apps are SolidJS + Tailwind (they use Kobalte; shadcn-style tokens are the target). They want the whole of upstream, natively in Solid, as separate packages like upstream's. They also want the library to stay agnostic of any UI component library so other Solid developers can adopt it or adapt it to their own design system.

An outside contributor opened PR #5 attempting a similar port. The owner decided **not** to merge it and to build in-house from upstream instead, discarding anything suspicious. PR #5 is not a source for this work (see "Provenance").

## Goals

1. **Parity with upstream at `c5e44d8`.** Same props, defaults, public exports (Solid-typed), rendered DOM (elements, Tailwind classes, `data-streamdown`/`data-sd-*` attributes), and behavior, for the core and all four plugins. Upstream's test suites are the parity oracle and get ported.
2. **Separate packages, mirroring upstream's split**, so consumers install only what they use.
3. **Native Solid throughout.** No React anywhere in the dependency graph, peer dependencies included.
4. **Cheap to keep in sync.** A future upstream release should be portable by diffing upstream and applying the same changes to files with the same names and layout.

## Non-goals

- Solid 2.0 support (still `2.0.0-rc.15` as of 2026-10-19). Target Solid 1.9.
- Backwards compatibility with the 1.x API. `<StreamMarkdown>`, `IncompleteMarkdownParser` and `parseIncompleteMarkdown` are removed.
- A docs website. Upstream's `apps/` (website, playground) and `skills/` are not ported.
- Behavior beyond or different from upstream. If an upstream bug blocks a correct Solid port, document the deviation in the package README and keep it minimal.
- Depending on any UI component library (shadcn, solid-ui, Kobalte, Ark). Built-in controls stay hand-rolled, as upstream's are.
- Porting upstream's `__benchmarks__`. Optional later.

## Anti-goals (failure even if it "works")

- **Less safe than upstream's defaults** on any path: sanitization, hardening, URL handling, link safety, Mermaid SVG insertion.
- **Pulling React, Shiki, Mermaid or KaTeX into a consumer's install** when they didn't ask for that plugin.
- **Streaming performance regression:** settled blocks re-rendering or rebuilding DOM on every incoming token. Today's 1.x already avoids this; 2.0 must too.
- **Any code or files copied from PR #5.**

## Constraints

- **Toolchain:** Bun (runtime, package manager, workspaces). Build packages with tsup (tsup-preset-solid for packages with JSX). Test with Vitest + jsdom. All of these come from `CLAUDE.md`.
- **solid-js** is a peer dependency (`^1.9.0`), never bundled. Dev against 1.9.17.
- **Conventions** from `CLAUDE.md`: kebab-case files, named exports only, Solid primitives (no React patterns), no unnecessary abstractions. Upstream's file names are already kebab-case.
- **Styling:** consumers use Tailwind v4 and add `@source "../node_modules/solid-streamdown/dist/*.js";` (and one line per installed plugin, as upstream documents). Colors come from shadcn-named CSS custom properties (`--background`, `--muted`, `--border`, …). That is what makes it library-agnostic: any app that defines those tokens works, shadcn or not. Document the minimal token set, as upstream's README does.
- **SSR-safe:** importing and rendering on the server must not touch browser globals. Clipboard, fullscreen, Mermaid, image download and portals run only on the client. Works in SolidStart and client-only apps.
- **Licensing:** 2.0 relicenses all five packages from MIT to **Apache-2.0**, matching upstream. Most of the code is close translation of upstream's, so labelling it MIT would be inaccurate. _(This was my recommendation and the default stated to the owner; it stands unless the owner overrides it.)_
  - Each package ships `LICENSE` (Apache-2.0) and a `NOTICE` crediting Vercel's Streamdown.
  - Each ported file gets a header comment naming its upstream source path and stating that it was modified for SolidJS, as Apache-2.0 §4(b) requires.
  - Keep and update `ATTRIBUTION.md`. The svelte-streamdown attribution goes away along with the code it covered.
- **npm scope:** `@solid-streamdown` is unclaimed as of 2026-10-19. The owner must create it as an npm org and grant the CI release token publish rights before plugins can ship. Releases keep npm provenance and granular tokens (current `release.yml` setup).

## Decisions

### Decided by the owner

- Rebuild every part of upstream, including code, math, mermaid and cjk.
- Separate packages.
- Tailwind styling, compatible with shadcn tokens, independent of any component library.
- Build our own implementation; don't merge PR #5; discard anything suspicious.

### Delegated to me ("whatever you think is best")

**Release and API**

- **2.0.0, mirroring upstream's API.** The component is `Streamdown`, markdown comes in through `children`, the stream state through `isAnimating`, and every upstream prop is kept with the same name and default.
- **`createMarkdownStream()` stays** as a small Solid helper (`write`/`end`/`reset`/`content()`/`isStreaming()`). The README shows it feeding `<Streamdown isAnimating={stream.isStreaming()}>{stream.content()}</Streamdown>`.

**Packages**

- **Monorepo layout mirrors upstream's directory names:**

  | Directory | npm name | Upstream counterpart |
  |---|---|---|
  | `packages/streamdown` | `solid-streamdown` | `streamdown` |
  | `packages/streamdown-code` | `@solid-streamdown/code` | `@streamdown/code` |
  | `packages/streamdown-math` | `@solid-streamdown/math` | `@streamdown/math` |
  | `packages/streamdown-mermaid` | `@solid-streamdown/mermaid` | `@streamdown/mermaid` |
  | `packages/streamdown-cjk` | `@solid-streamdown/cjk` | `@streamdown/cjk` |

  Inside each package, file paths match upstream's (`lib/components.tsx`, `lib/code-block/copy-button.tsx`, …) unless Solid forces otherwise.
- **`remend` is used as-is from npm** (pinned `1.4.0`). It has no dependencies and no React; porting it would only create sync work.
- **Plugin packages are ports of upstream's.** Their code has no React; only their `package.json` peer dependency changes. Upstream's plugins are self-contained and don't import from `streamdown`, and ours stay that way. Their contract with core is the plugin types in `lib/plugin-types.ts`, kept structurally identical to upstream's.
- **Versioning:** Changesets, as upstream uses, so the five packages version and publish independently.
- **Phasing:** core first, then code, math, mermaid, cjk. Each phase leaves `main` green and releasable. Core includes all UI that upstream keeps in core (code block chrome, table controls, Mermaid fullscreen/pan-zoom/download, image controls, link-safety modal, animation, carets, translations, icons). Without a plugin installed, that UI degrades the way upstream's does.
- **Sync record:** a short `UPSTREAM.md` at the repo root records the upstream commit each package was last synced to, plus a table of intentional deviations.

**Solid adaptations (the only intended API differences)**

| Upstream (React) | Ours (Solid) |
|---|---|
| `className` | `class` |
| `components`, `BlockComponent`, `fallbackComponent`, `mermaid.errorComponent`, `CustomRenderer.component` take React components | Take Solid `Component`s |
| `linkSafety.renderModal` returns `ReactNode` | Returns `JSX.Element` |
| `useIsCodeFenceIncomplete()` returns `boolean` | Returns `Accessor<boolean>` |
| `memo` + custom comparators | Fine-grained reactivity; same "only changed blocks update" outcome |
| `useId` / context / portals | `createUniqueId` / `createContext` / Solid `Portal` (honoring the `portal` prop) |

Exported building blocks (`CodeBlock`, `CodeBlockCopyButton`, `TableCopyDropdown`, …) are Solid components with the same names and props.

## Security requirements

- **Default pipeline matches upstream exactly:** `remark-rehype` with raw HTML passed through, then `rehype-raw` → `rehype-sanitize` (upstream's schema: `clobberPrefix: ""`, `tel` + `streamdown` protocols, `metastring` on `code`) → `rehype-harden` (upstream's options). Same `defaultRemarkPlugins` / `defaultRehypePlugins` exports.
- **Link safety on by default**, as upstream.
- **Raw-HTML APIs: exactly upstream's three uses, no others** _(my call: parity wins, with named exceptions)_. These are:
  1. Core inserts the Mermaid SVG returned by the plugin's `render()`. The plugin defaults to `securityLevel: "strict"`, and a consumer's `mermaid.config` may override that, as upstream allows, because consumer config is trusted.
  2. `DOMParser` parses that SVG in an inert document for SVG/PNG download.
  3. The table copy control puts the rendered table's `outerHTML` on the clipboard as `text/html`. That is a serialization of already-sanitized DOM, and nothing is inserted into the page.

  Nothing else may use `innerHTML`, `insertAdjacentHTML`, `outerHTML`, `DOMParser`, `eval` or `new Function` on content-derived data. The security tests list these three as named exceptions.
- **Always-on render guard in the HAST→Solid bridge** _(my call)_. Upstream's React users get some protection from React DOM itself, even when they replace `rehypePlugins` and drop sanitize/harden: React never runs `<script>` elements it creates, ignores string `on*` handlers, and (React 19) blocks `javascript:` URLs. Solid creates real DOM with `document.createElement`, so a straight port would lose all three. The bridge therefore enforces the following no matter which plugins are configured:
  - drop `script` elements;
  - drop every `on*` attribute;
  - drop any property whose name is special to Solid: `innerHTML`, `textContent`, `innerText`, `ref`, `classList`, or anything containing `:` (`on:*`, `oncapture:*`, `prop:*`, `attr:*`, `use:*`);
  - neutralize `javascript:` and `vbscript:` URLs in URL-valued attributes (the `html-url-attributes` list).

  This matches the React 19 baseline upstream users actually get. The only visible difference is that an inert `<script>` element is missing from the DOM. Tag names from markdown (custom tags, `allowedTags`, `fallbackComponent` paths) never select a component except through the consumer's `components` map. Hostile-input fixtures test the guard with sanitize and harden both removed.
- **Image download** fetches the image URL, as upstream does. It must not do anything upstream doesn't (no credentials mode, no fetch of non-image URL schemes).
- **Audit lessons from PR #5:** see the appendix. Every confirmed finding there becomes a regression test.

## Known risks (for the builder to solve)

- **No virtual DOM.** React reconciles each re-render of the actively streaming block, so existing DOM nodes survive. Re-running `toJsxRuntime` in Solid builds fresh nodes each time. Naively, that restarts reveal animations, drops text selection, flashes code highlighting, resets copy-button state and re-renders Mermaid on every token. Upstream's animation design (committing the revealed character count so settled text isn't wrapped in animation spans) partly assumes reconciliation. This is the hardest part of the port, and the design has to address it explicitly.
- **Test porting volume.** Upstream has ~100 test files for core, ~30 for remend (no port needed, since we use the package), and 7 across the plugins. They use React Testing Library; the Solid versions use `@solidjs/testing-library`.

## Left to the builder

- How settled blocks stay untouched and the active block stays stable during streaming (see Known risks).
- Workspace, tsconfig and tsup setup per package. CI and release workflow changes for multi-package Changesets publishing.
- Whether any behavior needs a real-browser test runner beyond jsdom.
- The order of work inside each phase.
- Updating `CLAUDE.md` and `README.md` for the monorepo (commands, layout, migration notes from 1.x).

## Provenance

PR #5 (`Blankeos/solid-streamdown`, head `e51e547`) was read for a security audit only. Nothing from it is copied, including code, tests, docs, its `.agents/` skill file, and its Gittydocs docs tooling. Implementation is derived from upstream `vercel/streamdown` only.

## Appendix: PR #5 audit lessons

A static security review of PR #5 (nothing from it was installed or run) found its sanitize schema, plugin order, code highlighting, KaTeX options, URL handling and downloads matching upstream or safer. It also found the issues below. Each is a must-not-repeat rule for this build, with a regression test.

1. **CSS injection through `<td align>` / `<th align>`** (medium; independently confirmed, confidence 8/10). The PR turned `align` into a style *string* (`text-align:${value}`). Solid applies string styles through `cssText`, so `align="left;position:fixed;inset:0;…"` let attacker markdown break out of the message and lay a full-viewport overlay over the host app, with working links inside it for phishing. That happened in both client and SSR output. Upstream's client render is safe here because React assigns `style.textAlign`, which drops invalid values. Upstream's SSR output may carry the same injection; that wasn't verified. The allowlist rule below covers both.
   - **Rule:** styles derived from HAST reach Solid only as objects (Solid applies those with `setProperty`), never as strings. `align` is accepted only if it is `left`, `right`, `center` or `justify`.
   - **Test:** `<td align="center;color:red;position:fixed">` leaves `style.color` and `style.position` empty, for `td` and `th`, on client and SSR.
2. **HAST props overriding a wrapper's own props** (needs consumer config to trigger). The PR spread HAST-derived props after `<Dynamic component=…>`, so an allowed `component` attribute could pick the element to create, `script` included.
   - **Rule:** the render guard also drops these reserved names after sanitize: `component`, `children`, `is`, `style` given as a string, and the `bool:` namespace.
   - **Rule:** wrapper components put their own props *after* any spread of content-derived props.
3. **Mermaid `bindFunctions`** (needs consumer config to trigger). The PR called it and upstream doesn't. Under a consumer-set `securityLevel: "loose"`, it lets `click A call …` in a diagram run code.
   - **Rule:** don't call `bindFunctions`, matching upstream.

Known upstream risks that stay as-is for parity: `clobberPrefix: ""` (DOM clobbering via `id`/`name`), no spreadsheet-formula escaping in CSV export, and links inside Mermaid SVGs skipping the link-safety prompt. These are listed in `UPSTREAM.md` so they're fixed together with upstream if upstream changes them.
