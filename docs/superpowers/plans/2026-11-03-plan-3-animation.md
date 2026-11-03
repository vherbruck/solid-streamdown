# Plan 3: Animation and carets

> **For agentic workers:** execute task by task, in order. Steps use checkbox (`- [ ]`) syntax. Each task ends green (`bun run typecheck && bun run test`, plus the hydration check where noted) and with one commit.

**Status:** Done 2026-11-03. The owner said to proceed; no owner decisions were open.

**Goal:** Port upstream's streaming word animation: the `animated` prop, `createAnimatePlugin`, the shared stagger timeline, `styles.css` keyframes, list-marker, checkbox and void-element animation, and spans that come off when the stream settles. Revealed words must keep their DOM nodes while later words stream in. Also port the deferred-render hook and close plan 3's carry-forward items.

**Architecture:**
- `lib/animate.ts` is framework-free and is copied verbatim. It is a rehype plugin that wraps words in `span[data-sd-animate]` with CSS custom properties.
- Each streaming block gets its own plugin instance, sharing one timeline per `Streamdown`.
- Upstream drives the timeline from React's render pass:
  - `beginPass` during render;
  - each block's plugin calls `take`;
  - `commitPass` in a layout effect.

  Solid has no render pass. Instead, a thin wrapper opens a pass lazily, on the first `mark`/`take` after a commit, and a `createEffect` in `Streamdown` commits it after the DOM updates. Each `Block` calls its plugin's `commit()` in a `createEffect` after its tree updates. That is upstream's `useLayoutEffect`.
- The reactive renderer reconciles each re-parse into the existing store by position, so a revealed word's `<span>` survives. Only its `--sd-duration` drops to `0ms`, exactly as React's reconciliation does.

**Spec:** `docs/superpowers/specs/2026-10-19-streamdown-parity-rebuild-design.md`
**Carry-forward:** `docs/superpowers/plans/2026-10-21-plan-1-carry-forward.md`, sections "Plan 3" and "Every later plan"
**Upstream:** `/tmp/streamdown-upstream` at `c5e44d8` (clone command in plan 1). `UP/` = `/tmp/streamdown-upstream/packages/streamdown/`.

## Global Constraints

Plan 1's and plan 2's constraints apply. In particular:
- headers on ported files;
- `class`, not `className`;
- lazy context reads;
- nothing copied from PR #5;
- the "Every later plan" rules in the carry-forward file (hydration keys, empty server attributes, delegated events).

Plan-specific:

- **Object styles from plugins.** HAST parsed from markdown only ever carries string styles. A plugin, upstream's `createRenderAnimatePlugin` included, may set `style` to an object of strings.
  - The render guard accepts such an object when every value is a string or number, and passes it to Solid as an object.
  - Solid applies it with `setProperty`, and its server renderer escapes keys and values.
  - String styles keep going through `style-to-object` as before.
- **No React-only machinery.** StrictMode mark/rewind stays in `lib/animate.ts`, which is copied verbatim, but nothing in Solid triggers it.
- `hooks/use-throttled-debouce.ts` is not ported: upstream defines it and never imports it.

## Review Focus

1. **Revealed words keep their nodes.** Streaming "one two" then "one two three" keeps both earlier `<span>`s. Their `--sd-duration` becomes `0ms`, and only "three" animates. Test in Task 2.
2. **Settling.** When `isAnimating` goes false, the spans come off and the text stays, without remounting block-level hosts (`p`, `li`, `h1`). Upstream test "does not remount block-level hosts when isAnimating flips off".
3. **Cross-block stagger.** A new block's first word starts after the previous block's cascade (issue #482), across streaming ticks.
4. **Server render, then hydrate, while animating.** No mismatch, and no duplicated text. Task 5 extends the hydration check.

---

### Task 1: Animate plugin, styles and object styles in the guard

**Files:**
- Create (ported verbatim plus header): `lib/animate.ts`, `styles.css` (package root, from `UP/styles.css`)
- Modify:
  - `index.tsx`: move `AnimateOptions` out, re-export it and `createAnimatePlugin` from `lib/animate`, as upstream does. This is a carry-forward item.
  - `lib/hast-props.ts`: accept object styles, as above.
- Test (ported): `__tests__/animate.test.ts`, `__tests__/animate-style-objects.test.tsx`. Add a guard test to `__tests__/hast-props.test.ts`:
  - an object style with string values is kept;
  - an object holding a non-string value is dropped;
  - a string style still goes through the parser.

- [x] **Step 1:** Copy the tests. Run them. Expected: FAIL (module missing).
- [x] **Step 2:** Copy `lib/animate.ts` and `styles.css`. Move `AnimateOptions`. Change the guard.
- [x] **Step 3:** Run typecheck and tests. Expected: PASS. Commit: `feat: port the animate plugin and its stylesheet`.

### Task 2: Wire animation into Streamdown

**Files:**
- Modify: `index.tsx`:
  - a timeline per distinct `animated` value, with values compared by `JSON.stringify` like upstream's `animatedKey`;
  - per-block plugins created lazily by block index;
  - the lazy-pass timeline wrapper;
  - `Block` gains an `animatePlugin` prop and commits after its tree updates;
  - the plugin is attached only while `isAnimating`.
- Test (ported): `__tests__/animate-issues.test.tsx`, `__tests__/list-animation-retrigger.test.tsx`, `__tests__/void-element-animation.test.tsx`. Also the "animate.ts remaining coverage" describe into `__tests__/remaining-coverage.test.tsx`, and un-skip "drops animation spans once the stream settles" in `memo-render-equivalence.test.tsx`.
- Test (new): `__tests__/animate-streaming.test.tsx`, `__tests__/animate.ssr.test.tsx`

**Notes:**
- Converted tests drive props with signals, not the remounting `renderWithRerender`. These tests are about nodes surviving.
- The StrictMode case ("suppresses already-seen words under StrictMode double-invoke") has no Solid equivalent. Port it as a test that one parse per update takes one timeline slot.

- [x] **Step 1:** Port the tests. Run them. Expected: FAIL.
- [x] **Step 2:** Implement the wiring.
- [x] **Step 3: New tests:**
  - **Revealed spans keep their nodes:** the earlier word spans are the same nodes, their `--sd-duration` is `0ms`, and the new word animates.
  - **Settling keeps the hosts:** settling removes every `[data-sd-animate]` and keeps the same `<p>`.
  - **No animation in static mode:** `mode="static"` never animates.
  - **Server render:** with `animated` and `isAnimating`, the server output holds word spans with their custom properties and no empty attributes.
- [x] **Step 4:** Typecheck, tests and hydration check. Commit: `feat: animate streamed words`.

### Task 3: Carry-forward fixes

**Files:** `index.tsx`, `lib/use-caret-host.ts`, `__tests__/caret.test.tsx`, `__tests__/streamdown.test.tsx`

- [x] **Step 1:** Wrap the `onAnimationStart`/`onAnimationEnd` calls in `untrack`. Test: a callback that reads a signal does not re-fire when that signal changes.
- [x] **Step 2:** Re-mark the caret host when the last rendered element changes for any reason, a `components` swap included, not only when `blocks()` changes. Test: swapping `components` so the last element is replaced keeps it marked `data-sd-caret-hidden` while a table is last.
- [x] **Step 3:** Run tests. Commit: `fix: untrack animation callbacks and re-mark the caret host on component swaps`.

### Task 4: Deferred render

**Files:**
- Create (ported, Solid primitive): `hooks/use-deferred-render.ts` exporting `createDeferredRender(options)`. It returns `{ shouldRender: Accessor<boolean>, ref: (el: HTMLElement) => void }`, and exports the three `DEFERRED_RENDER_*` constants.
  - The flow matches upstream: IntersectionObserver, a debounce, then `requestIdleCallback` with a polyfill.
  - Everything is set up in `onMount` and torn down in `onCleanup`.
  - On the server, `shouldRender` is `false` unless `immediate` is set.
- Test (ported): `__tests__/use-deferred-render.test.tsx`
- Modify: `tsconfig.json` (include `hooks/**/*`), `UPSTREAM.md` (rename row)

- [x] **Step 1:** Port the test. Run it. Expected: FAIL.
- [x] **Step 2:** Implement. Run it. Expected: PASS. Commit: `feat: port the deferred render primitive`.

### Task 5: Hydration, records

- [x] **Step 1:** Extend `scripts/hydration-check.mjs`:
  - server-render a streaming document with `animated` and `isAnimating`, then hydrate it;
  - stream two more ticks and check that the earlier word spans are the same nodes;
  - settle, and check that no `[data-sd-animate]` remains and no text is duplicated.
- [x] **Step 2:** `UPSTREAM.md` rows:
  - timeline pass wiring (lazy begin, effect commit);
  - object styles accepted from plugins;
  - `createDeferredRender` instead of `useDeferredRender`;
  - `use-throttled-debouce.ts` not ported.
- [x] **Step 3:** Update the carry-forward file: strike the plan 3 items and add new ones.
- [x] **Step 4:** Run the full "Done when" list. Commit: `test: hydrate animated streams; record plan 3 deviations`.

## Done when

- `bun run typecheck && bun run build && bun run test && bun run --filter solid-streamdown test:hydration` exit 0.
- `grep -rn "plan 3" packages/streamdown` finds nothing in code or tests.
- Every upstream animation test file named here exists under `__tests__/`.
- `packages/streamdown/styles.css` exists and is listed in `files` and `exports`.
- `UPSTREAM.md` lists every deviation introduced here.
