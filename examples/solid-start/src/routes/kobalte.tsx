import { kobalteUi } from "@solid-streamdown/kobalte";
import { Streamdown } from "solid-streamdown";

const markdown = `# Kobalte controls

| Name | Age |
| --- | --- |
| Alice | 30 |

\`\`\`ts
const answer = 42;
\`\`\`

Read the [docs](https://example.com).`;

// Server-rendered with the Kobalte primitives, then hydrated.
export default function KobalteRoute() {
  return (
    <main class="mx-auto max-w-3xl p-6">
      <Streamdown mode="static" ui={kobalteUi}>
        {markdown}
      </Streamdown>
    </main>
  );
}
