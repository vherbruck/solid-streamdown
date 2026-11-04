# Plan 7: Release

> **For agentic workers:** execute task by task. Each task ends green (`bun run typecheck && bun run build && bun run test && bun run docs:check && bun run --filter solid-streamdown test:hydration`) and with one commit, made only after those pass.

**Status:** Done 2026-11-04, apart from the owner steps below; publishing happens when this branch merges to `main`.

**Goal:** make the five packages publishable from CI with Changesets, and get the first release (a 2.0 beta) ready to publish when this branch merges to `main`.

## Owner decisions (2026-11-04)

- **Beta first.**
  - Changesets pre mode with the tag `beta`.
  - The first publish is `solid-streamdown@2.0.0-beta.0`, under the npm dist-tag `beta`.
  - `latest` stays on 1.0.1 until pre mode is exited.
- **Plugin versions match upstream's:**

  | Package | Upstream | First beta |
  |---|---|---|
  | `@solid-streamdown/code` | 2.0.0 | `2.0.0-beta.0` |
  | `@solid-streamdown/math` | 1.0.3 | `1.0.3-beta.0` |
  | `@solid-streamdown/mermaid` | 1.0.3 | `1.0.3-beta.0` |
  | `@solid-streamdown/cjk` | 1.0.4 | `1.0.4-beta.0` |

  Changesets only bumps from a current version. Each plugin therefore starts one bump below its target (code `1.0.0` with a major changeset; the others one patch below with a patch changeset). Those starting versions were never published.
  - After 1.0, the plugin versions follow our own changes, not upstream's numbers.
- **Changesets bot:**
  - On every push to `main`, `changesets/action` opens or updates a "Version Packages" PR.
  - Merging that PR publishes every bumped package with npm provenance.

## Decisions made here

- **Release runs as a job in `ci.yml`.** The job `needs` the build job, so nothing publishes unless typecheck, the tests, the docs check, hydration and the Playwright smoke tests pass on that commit. It runs only on pushes to `main`. `release.yml` is deleted: it publishes from the private root, and runs a script that no longer exists.
- **`changesets/action` v1.9.0**, pinned by commit SHA (`a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d`):
  - v1 is the line for Changesets CLI 2.x, which we use (2.31.1); v2 needs Changesets 3.
  - The SHA pin matters because this job holds the npm token and write permissions.
- **npm auth:**
  - Uses the existing granular token (`NPM_TOKEN`), as the spec requires. The action writes it to `.npmrc`.
  - Provenance comes from `NPM_CONFIG_PROVENANCE=true` with `id-token: write`.
  - Trusted publishing (no token) can replace this once all five packages exist on npm, since npm configures it per existing package.
- **The first version is computed here, not by the bot.** This branch runs `changeset pre enter beta` and `changeset version` and commits the result.
  - The PR to `main` therefore shows the exact versions and changelogs.
  - Merging it publishes them: the bot sees no unreleased changesets and goes straight to `changeset publish`.
- **The version script updates `bun.lock`.** It runs `changeset version && bun install`, because the lockfile records workspace versions and CI installs with `--frozen-lockfile`.
- **The `"use client"` directive stays in the plugins' `index.ts`.**
  - The files are verbatim copies of upstream's, and the build warning is cosmetic: upstream's build prints it too.
  - The directive is dropped from the bundle either way.
- **R4:** the caret-suppression hydration case already runs in the hydration check (built output, server render then hydrate in both client builds). The `it.skip` placeholder in `caret-suppression.test.tsx` becomes a pointer there, because Vitest's `dom` project cannot load the server build in the same process.
- **R19: accepted as is.**
  - While hydrating, a text node adopts the server's node only if Solid is handed a string.
  - Solid keeps no handle to that node afterwards. At the first update after hydration, `hydratingText` therefore swaps in its own text node, and keeps it from then on.
  - The cost is one node replacement per hydrated text, once. The only visible effect is a text selection inside that text being lost on the first streamed token after hydration.
  - Finding the server node by position would mean re-walking Solid's hydration order, which is fragile across Solid versions. The hydration check pins the current behavior.

## Owner steps (outside the repo)

1. Create the npm org `@solid-streamdown`.
2. Give the `NPM_TOKEN` granular token read and write access to the `@solid-streamdown` scope as well as `solid-streamdown`.
3. In the repository's Settings → Actions → General, enable "Allow GitHub Actions to create and approve pull requests". The bot needs it for every release after the first.
4. Merge this branch into `main` once 1 and 2 are done; the merge publishes the beta.

## Tasks

1. **Release workflow.**
   - Root scripts: `changeset`, `version-packages` (`changeset version && bun install`), `release` (`changeset publish`).
   - A `release` job in `ci.yml`; delete `release.yml`.
   - The changeset texts say what each first release is.
2. **Hydration harness.**
   - The document fixture streams into its trailing block, as a live reply does: it checks that the block's element and text node survive.
   - A failed client pass names its build (`browser`, `browser + development`) instead of echoing the command line.
   - R4 placeholder replaced; R19 recorded.
3. **Beta.**
   - Starting versions as above, `changeset pre enter beta`, `changeset version`, lockfile updated.
   - The READMEs and the install sections of the guide say to install `@beta` until 2.0 is final.
4. **Records.**
   - `UPSTREAM.md` notes the version scheme.
   - In the carry-forward file, mark plan 7 done and keep the owner steps.
   - Mark this plan done.

## Done when

- `bun run typecheck && bun run build && bun run test && bun run docs:check && bun run test:e2e && bun run --filter solid-streamdown test:hydration` exit 0.
- `npm pack --dry-run` in each package lists only `dist`, the license files, the README (and `styles.css` for core), at the beta version.
- Every changeset is consumed by pre mode (`.changeset/pre.json`), so the release job publishes rather than opening a Version Packages PR. `changeset status` cannot show this: it reports packages changed since `main` with no unconsumed changeset.
- `actionlint` (or a YAML parse) accepts `ci.yml`.
