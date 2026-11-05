# Plan 10: Sync to upstream 072ce7e

> **For agentic workers:** execute task by task. Each task ends green (`bun run typecheck && bun run build && bun run test:types && bun run test && bun run docs:check && bun run --filter solid-streamdown test:hydration`, plus `bun run test:e2e` at the end) and with one commit, made only after those pass.

**Status:** Done 2026-11-05, on branch `chore/cleanups-and-upstream-sync`, which also clears the deferred minors (see the carry-forward file). It targets `main` after PR #7 has merged and published `2.0.0-beta.0`. Its changesets then become the `2.0.0-beta.1` Version Packages PR.

**Goal:** bring every package from upstream c5e44d8 to 072ce7e, which is `main` on 2026-11-05, 15 commits after the sync point.

## Upstream commits

| Commit | PR | Change | Here |
|---|---|---|---|
| 66779a8 | #695 | Prefix raw HTML ids without doubling footnote prefixes | Ported: `undoubleClobberPrefix`, the default `clobberPrefix`, upstream's tests. The docs samples that rebuild `rehypePlugins` keep the new plugin, and the security page drops the clobbering risk |
| 97c1f87 | #668 | Mermaid: no error for a partial chart while the fence streams | Ported, plus a test that closes the fence through the context alone (the harness reruns the render effect on every rerender, so upstream's test passes without the fix) |
| c6f5905 | #693 | Keep the Mermaid SVG markup object stable | Test only: the fix is for React 19.2's `dangerouslySetInnerHTML`; Solid's `innerHTML` already updates only when the string changes |
| ec1489a | #702 | Key processor caches by plugin function identity | Test only: already a recorded deviation. The UPSTREAM.md row now describes the remaining difference (options keys) |
| ae6fa3b, 7dcabc6 | #704, #707 | `exactOptionalPropertyTypes` in public and plugin types | Ported, with upstream's type tests and a new `bun run test:types` CI step. Core's test also checks every optional property of the exported prop and option types |
| 469ba74 | #705 | Remove the animate plugin's name workaround | Ported (`lib/animate.ts` is verbatim again) |
| 4e2c00a | #712 | Case-insensitive download extensions | Ported. Upstream now uses own keys only, so that deviation row and our duplicate test are gone |
| 072ce7e | #716 | CJK: split `www` autolinks at CJK punctuation | Ported |
| 2dbe48b | #710 | Stale docs links | The Mermaid examples link and the security page's `allowedTags` link. The skill reference has no counterpart here |
| dfdddbc, 908ea2f, 1f96b30, 5e992c4, b3c93fa | | Docs-site dependency bumps, release workflow | Skipped |

## Not synced

- **`remend`:** #704 also changed `remend`'s option types, but remend 1.4.0 (the version we depend on) predates it. The `remend` prop's options gain `| undefined` when remend publishes that change. Then bump the dependency, and add `remend={{ bold: undefined }}` to core's type test, as upstream's has.

## Records

- Every ported file's header names 072ce7e.
- UPSTREAM.md: the Synced to table, a sync history entry, the processor cache row; the clobbering risk is gone, and so is the download-extension row.
- `.changeset/upstream-sync-072ce7e.md`: a patch for core and the four plugins. `@solid-streamdown/kobalte` is not bumped; its peer range still matches.
