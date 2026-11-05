---
"solid-streamdown": patch
"@solid-streamdown/code": patch
"@solid-streamdown/math": patch
"@solid-streamdown/mermaid": patch
"@solid-streamdown/cjk": patch
---

Synced to upstream Streamdown 072ce7e:

- Raw HTML ids are prefixed with `user-content-` again, so they cannot clobber globals such as `window.details`. The new `defaultRehypePlugins.undoubleClobberPrefix` keeps footnote ids from being prefixed twice and points `#` links at the prefixed ids. If you rebuild `rehypePlugins`, put it right after the sanitize step.
- Mermaid shows the loader, not a parse error, for a chart whose fence is still streaming, and renders the chart again when the fence closes.
- Optional properties in the public types accept an explicit `undefined` (`exactOptionalPropertyTypes`), in core and in the code, math and Mermaid plugins.
- The code download button matches fence languages case-insensitively (`Python` downloads as `.py`).
- CJK: `www` autolinks end at CJK punctuation.
