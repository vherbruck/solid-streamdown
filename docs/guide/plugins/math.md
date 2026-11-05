<!-- Ported from vercel/streamdown apps/website/content/docs/plugins/math.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# @solid-streamdown/math

Render mathematical expressions using KaTeX.

The `@solid-streamdown/math` plugin renders mathematical expressions using [KaTeX](https://katex.org/).

- Fast LaTeX rendering (2-3x faster than MathJax)
- Inline and block math support
- MathML output for accessibility
- Configurable error color and single-dollar syntax

## Install

```bash
bun add @solid-streamdown/math
```

```bash
npm i @solid-streamdown/math
```

The plugin depends on `katex`. Your app imports KaTeX's stylesheet (`katex/dist/katex.min.css`, below); with a package manager that does not hoist dependencies (such as pnpm), add `katex` to your own dependencies too so that import resolves.

## Tailwind CSS

The math plugin renders no Tailwind classes of its own (KaTeX's output is styled by KaTeX's stylesheet), so it needs no `@source` line (Tailwind v4) or `content` entry (Tailwind v3).

## Usage

<!-- example: examples/vite/src/snippets/plugins-math/usage.tsx -->
```tsx
import "katex/dist/katex.min.css";
import { math } from "@solid-streamdown/math";
import { Streamdown } from "solid-streamdown";

const markdown = "The quadratic formula is $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$.";

export default function Chat() {
  return <Streamdown plugins={{ math }}>{markdown}</Streamdown>;
}
```

The CSS import can live in your main stylesheet instead:

```css
@import "katex/dist/katex.min.css";
```

## Syntax

Streamdown uses double dollar signs (`$$`) to delimit mathematical expressions. Unlike traditional LaTeX, single dollar signs (`$`) are **not** used by default to avoid conflicts with currency symbols in regular text.

### Inline Math

Wrap inline mathematical expressions with `$$`:

```markdown
The quadratic formula is $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$ for solving equations.
```

### Block Math

For display-style equations, place `$$` delimiters on separate lines:

```markdown
$$
E = mc^2
$$
```

This renders the equation centered and larger.

## Common Mathematical Expressions

### Fractions

```markdown
$$\frac{numerator}{denominator}$$
```

### Square Roots

```markdown
$$\sqrt{x}$$ or $$\sqrt[n]{x}$$
```

### Exponents and Subscripts

```markdown
$$x^2$$ or $$x_i$$ or $$x_i^2$$
```

### Greek Letters

```markdown
$$\alpha, \beta, \gamma, \delta, \theta, \pi, \sigma, \omega$$
$$\Gamma, \Delta, \Theta, \Pi, \Sigma, \Omega$$
```

### Summations

```markdown
$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$
```

### Integrals

```markdown
$$\int_{a}^{b} f(x) \, dx$$
```

### Limits

```markdown
$$\lim_{x \to \infty} \frac{1}{x} = 0$$
```

### Matrices

```markdown
$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
$$
```

## Advanced Examples

### The Quadratic Formula

```markdown
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### Euler's Identity

```markdown
$$
e^{i\pi} + 1 = 0
$$
```

### Normal Distribution

```markdown
$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}
$$
```

### Taylor Series

```markdown
$$
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots
$$
```

### Integration by Parts

```markdown
$$
\int u \, dv = uv - \int v \, du
$$
```

## Special Operators and Symbols

### Comparison Operators

```markdown
$$\leq$$ $$\geq$$ $$\neq$$ $$\approx$$ $$\equiv$$
```

### Set Notation

```markdown
$$\in$$ $$\notin$$ $$\subset$$ $$\subseteq$$ $$\cup$$ $$\cap$$ $$\emptyset$$
```

### Logic Symbols

```markdown
$$\land$$ $$\lor$$ $$\neg$$ $$\implies$$ $$\iff$$ $$\forall$$ $$\exists$$
```

### Calculus Notation

```markdown
$$\frac{dy}{dx}$$ $$\frac{\partial f}{\partial x}$$ $$\nabla$$ $$\infty$$
```

## Configuration

### Custom Error Color

Customize how errors are displayed using `createMathPlugin`:

<!-- example: examples/vite/src/snippets/plugins-math/error-color.tsx -->
```tsx
import "katex/dist/katex.min.css";
import { createMathPlugin } from "@solid-streamdown/math";
import { Streamdown } from "solid-streamdown";

const math = createMathPlugin({
  errorColor: "#dc2626",
});

const markdown = "Valid: $$E = mc^2$$. Invalid: $$\\frac{1}{$$.";

export default function ErrorColor() {
  return <Streamdown plugins={{ math }}>{markdown}</Streamdown>;
}
```

### Complete Configuration Example

<!-- example: examples/vite/src/snippets/plugins-math/complete-config.tsx -->
```tsx
import "katex/dist/katex.min.css";
import { createMathPlugin } from "@solid-streamdown/math";
import { Streamdown } from "solid-streamdown";

const math = createMathPlugin({
  singleDollarTextMath: true, // Enable $...$ syntax (default: false)
  errorColor: "#dc2626", // Custom error color (default: "var(--color-muted-foreground)")
});

const markdown = "Single dollars now delimit math: $a^2 + b^2 = c^2$.";

export default function CompleteConfig() {
  return <Streamdown plugins={{ math }}>{markdown}</Streamdown>;
}
```

### Get CSS Path

Use `getStyles()` to get the CSS path programmatically:

<!-- example: examples/vite/src/snippets/plugins-math/get-styles.tsx#get-styles -->
```tsx
const cssPath = math.getStyles?.();
// "katex/dist/katex.min.css"
```

## Streaming Considerations

### Incomplete Equations

Streamdown's unterminated block parser handles incomplete equations gracefully:

```markdown
$$
E = mc^
```

During streaming, the parser detects the incomplete block-level equation and adds the closing `$$` delimiter, ensuring proper rendering even before the equation is complete. See [Unterminated Block Parsing](../termination.md).

### Inline vs Block Detection

The parser distinguishes between inline and block math:

- **Inline**: `$$E = mc^2$$` (same line)
- **Block**: Separate lines with newlines

```markdown
This is inline $$E = mc^2$$ math.

$$
E = mc^2
$$

This is block math.
```

## Common Issues

### Escaping Backslashes

In JavaScript/TypeScript strings, backslashes need to be escaped. Template literals process escapes too, so use `String.raw` to keep backslashes as written:

<!-- example: examples/vite/src/snippets/plugins-math/escaping.tsx#escaping -->
```tsx
// Wrong: "\f" is a form feed escape, so KaTeX receives "rac{1}{2}"
// const markdown = "$$\frac{1}{2}$$";

// Correct: escape the backslash
const markdown = "$$\\frac{1}{2}$$";

// Also correct: String.raw keeps backslashes as written
const raw = String.raw`$$\frac{1}{2}$$`;
```

### Currency vs Math

Streamdown uses `$$` for math to avoid conflicts with currency:

```markdown
This item costs $5 and that one costs $10. (These are currency symbols)

This equation $$x = 5$$ is mathematical notation. (This is math)
```

### Spacing in Equations

Use `\,` for thin space, `\:` for medium space, `\;` for thick space:

```markdown
$$\int f(x) \, dx$$
```

## Accessibility

Mathematical expressions rendered by KaTeX include:

- **MathML** - Machine-readable math representation, with the LaTeX source in an `annotation` element
- **Semantic HTML** - Proper structure for screen readers
- **Scalable Typography** - Math scales with text size settings

The renderer creates KaTeX's MathML elements in the MathML namespace (and SVG elements in the SVG namespace), as React does; Solid's `Dynamic` alone would create them as HTML elements. See [UPSTREAM.md](../../../UPSTREAM.md).

## Plugin Interface

The math plugin implements the `MathPlugin` interface (exported as a type from `solid-streamdown`):

| Field | Type | Description |
|-------|------|-------------|
| `name` | `"katex"` | Plugin name |
| `type` | `"math"` | Plugin type |
| `remarkPlugin` | `Pluggable` | `remark-math`, for parsing |
| `rehypePlugin` | `Pluggable` | `rehype-katex`, for rendering |
| `getStyles` | `() => string` (optional) | Returns `"katex/dist/katex.min.css"` |

## Best Practices

### Keep Equations Readable

Break complex equations into steps:

```markdown
Start with the equation:

$$
f(x) = ax^2 + bx + c
$$

Complete the square:

$$
f(x) = a\left(x + \frac{b}{2a}\right)^2 + c - \frac{b^2}{4a}
$$
```

### Add Context

Explain your equations:

```markdown
The Pythagorean theorem states that for a right triangle:

$$
a^2 + b^2 = c^2
$$

where $$a$$ and $$b$$ are the legs and $$c$$ is the hypotenuse.
```

### Use Block Math for Complex Expressions

Reserve inline math for simple expressions:

```markdown
Good: The slope is $$m = \frac{y_2 - y_1}{x_2 - x_1}$$

Avoid: $$\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}$$ in the middle of text

Better:

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$
```

## Resources

- [KaTeX Documentation](https://katex.org/docs/supported.html) - Complete list of supported functions
- [KaTeX Support Table](https://katex.org/docs/support_table.html) - Feature compatibility
- [LaTeX Math Symbols](https://www.overleaf.com/learn/latex/List_of_Greek_letters_and_math_symbols) - Symbol reference

## Related Features

- [Typography](../typography.md) - Text styling that complements mathematical content
- [Unterminated Block Parsing](../termination.md) - How streaming works with equations
- [GitHub Flavored Markdown](../gfm.md) - Extended Markdown features

## Differences from Streamdown

- Install commands use `bun add` and `npm i` with our package name; the note on adding `katex` under strict package managers is new.
- The Tailwind CSS section is replaced by a note: the package renders no Tailwind classes, so the `@source` and `content` entries upstream lists are not needed.
- The rendered previews after each syntax sample ("Renders as", "Example:") are dropped: they rely on the docs site rendering math. The Vite example gallery renders the samples that come from `examples/vite`.
- The usage and configuration samples are complete Solid components instead of JSX fragments; the KaTeX CSS import is shown both in TSX and as a CSS `@import`.
- The escaping sample is corrected: upstream suggests an untagged template literal, but template literals process `\f` too; the sample uses `String.raw`, and uses `$$` in the "wrong" line to match the rest of the page.
- The accessibility list replaces upstream's "Title Attributes - LaTeX source in tooltips" with the MathML `annotation` that carries the LaTeX source, and adds the MathML namespace note.
- The `MathPlugin` interface listing is a table.
- Emoji markers in "Use Block Math for Complex Expressions" are plain words.
