---
"solid-streamdown": patch
---

- The processor cache keys symbols in plugin options by identity, so two symbols with the same description no longer share a processor.
- The footnotes `section` component, rendered directly without a HAST node, shows its children instead of nothing.
