<!-- Ported from vercel/streamdown apps/website/content/docs/link-safety.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Link Safety

Configurable confirmation modal for external links to protect users from malicious URLs.

When rendering AI-generated or user-generated content, links can pose security risks. The link safety feature adds a confirmation prompt before opening external links, similar to ChatGPT's implementation.

## Default Behavior

Link safety is **enabled by default**. Each link renders as a button, and when a user clicks it, a confirmation prompt appears with:

- The full URL being opened
- A "Copy link" button
- An "Open link" button
- Close via backdrop click or Escape key

Confirmed links open in a new tab with `noreferrer`. The built-in prompt renders through an internal overlay placed in `document.body`, or in the [`portal`](./interactivity.md#overlays-and-the-portal-target) target if you set one.

## Disabling Link Safety

To disable the confirmation prompt and render plain links that open directly:

<!-- example: examples/vite/src/snippets/link-safety/disable.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "Read the [Solid docs](https://docs.solidjs.com).";

export default function Chat() {
  return <Streamdown linkSafety={{ enabled: false }}>{markdown}</Streamdown>;
}
```

## Safelist with onLinkCheck

Use the `onLinkCheck` callback to allow trusted domains without showing the prompt:

<!-- example: examples/vite/src/snippets/link-safety/safelist.tsx#sync -->
```tsx
const SafelistedLinks = () => (
  <Streamdown
    linkSafety={{
      enabled: true,
      onLinkCheck: (url) =>
        // true opens the link directly; false shows the confirmation prompt
        url.startsWith("https://your-app.com") || url.startsWith("https://github.com"),
    }}
  >
    {markdown}
  </Streamdown>
);
```

The callback receives the URL and can return:

- `true` - Open the link directly without the prompt
- `false` - Show the confirmation prompt
- `Promise<boolean>` - Async checks are supported

### Async Safelist Check

For server-side safelist validation:

<!-- example: examples/vite/src/snippets/link-safety/safelist.tsx#async -->
```tsx
const ServerCheckedLinks = () => (
  <Streamdown
    linkSafety={{
      enabled: true,
      onLinkCheck: async (url) => {
        const response = await fetch("/api/check-url", {
          method: "POST",
          body: JSON.stringify({ url }),
        });
        const { isSafe } = await response.json();
        return isSafe;
      },
    }}
  >
    {markdown}
  </Streamdown>
);
```

## Custom Modal

Replace the default prompt with your own component using `renderModal`. It returns a `JSX.Element`:

<!-- example: examples/vite/src/snippets/link-safety/custom-modal.tsx -->
```tsx
import { Show } from "solid-js";
import { Portal } from "solid-js/web";
import { type LinkSafetyModalProps, Streamdown } from "solid-streamdown";

export function CustomLinkModal(props: LinkSafetyModalProps) {
  // Read props.isOpen and props.url inside JSX: they are live getters.
  return (
    <Show when={props.isOpen}>
      <Portal>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => props.onClose()}
        >
          <div class="rounded-lg bg-background p-6" onClick={(event) => event.stopPropagation()}>
            <h2 class="font-semibold">External Link</h2>
            <p>You're about to visit:</p>
            <code>{props.url}</code>
            <div class="mt-4 flex gap-2">
              <button onClick={() => props.onClose()} type="button">
                Cancel
              </button>
              <button
                onClick={() => {
                  props.onConfirm();
                  props.onClose();
                }}
                type="button"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}

const markdown = "Visit [example.com](https://example.com).";

export default function Chat() {
  return (
    <Streamdown
      linkSafety={{
        enabled: true,
        renderModal: (props) => <CustomLinkModal {...props} />,
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

`renderModal` is called once for each guarded link, when the link renders, not each time the prompt opens. Its props object has live getters, so read `props.isOpen` and `props.url` inside JSX or a memo, and pass the object on with a spread (`{...props}`) rather than destructuring it. A custom modal renders where the link is, inside the paragraph, so it controls its own placement: the example uses Solid's `<Portal>` to move it to `document.body`, and `portal` does not affect it.

### Modal Props

The `renderModal` function receives:

| Prop | Type | Description |
|------|------|-------------|
| `url` | `string` | The URL being opened |
| `isOpen` | `boolean` | Whether the modal is visible |
| `onClose` | `() => void` | Call to close the modal |
| `onConfirm` | `() => void` | Call to open the link in a new tab; call `onClose` as well to close the modal |

## Combining with Security Features

Link safety works alongside [content hardening](./security.md). Use both for comprehensive protection:

<!-- example: examples/vite/src/snippets/link-safety/with-hardening.tsx -->
```tsx
import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = "[Trusted](https://trusted.com/page) and [other](https://example.com).";

export default function SecureChat() {
  return (
    <Streamdown
      linkSafety={{
        enabled: true,
        onLinkCheck: (url) => url.startsWith("https://trusted.com"),
      }}
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        [
          harden,
          {
            defaultOrigin: "https://trusted.com",
            allowedLinkPrefixes: ["https://trusted.com", "https://github.com"],
          },
        ],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
```

This provides two layers of protection:

1. **Content hardening** - Blocks or rewrites disallowed URLs at render time
2. **Link safety prompt** - Requires user confirmation before navigation

Links inside Mermaid diagrams skip the prompt, as they do in Streamdown. This is a known upstream risk kept for parity; see [UPSTREAM.md](../../UPSTREAM.md).

## TypeScript

Import the types for custom modal implementations:

<!-- example: examples/vite/src/snippets/link-safety/types.tsx#config -->
```tsx
import type { LinkSafetyConfig, LinkSafetyModalProps } from "solid-streamdown";
import { CustomLinkModal } from "./custom-modal";

const config: LinkSafetyConfig = {
  enabled: true,
  onLinkCheck: (url) => url.startsWith("https://safe.com"),
  renderModal: (props: LinkSafetyModalProps) => <CustomLinkModal {...props} />,
};
```

## API Reference

### LinkSafetyConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable link interception and the prompt |
| `onLinkCheck` | `(url: string) => boolean \| Promise<boolean>` | - | Optional safelist callback |
| `renderModal` | `(props: LinkSafetyModalProps) => JSX.Element` | - | Optional custom modal |

### LinkSafetyModalProps

| Property | Type | Description |
|----------|------|-------------|
| `url` | `string` | The URL to be opened |
| `isOpen` | `boolean` | Modal visibility state |
| `onClose` | `() => void` | Close the modal without navigation |
| `onConfirm` | `() => void` | Open the link (it does not close the modal) |

## Differences from Streamdown

- `renderModal` returns a Solid `JSX.Element` instead of a `ReactNode`. It runs once per link with a props object of live getters, where Streamdown calls it on each render with fresh values.
- The custom modal example uses `<Show>` and Solid's `<Portal>`, and calls `onClose` after `onConfirm`. Streamdown's page says `onConfirm` also closes the modal; in both libraries it only opens the link.
- The built-in prompt renders through an internal overlay primitive and Solid's `<Portal>`, which wraps it in a container `<div>`. See [UPSTREAM.md](../../UPSTREAM.md).
- The hardening example keeps `defaultRehypePlugins.sanitize` (and `undoubleClobberPrefix` after it) and sets `defaultOrigin`. Streamdown's version leaves out sanitize, which removes XSS protection, and omits `defaultOrigin`, without which `rehype-harden` throws when link prefixes are restricted. It also drops `allowedProtocols: ["https", "mailto"]`: `rehype-harden` always allows those, and matches entries with a trailing colon (`"mailto:"`), so the line changed nothing. See [Security](./security.md#restricting-protocols).
- The examples use a module-level Markdown string instead of a `content` prop.
