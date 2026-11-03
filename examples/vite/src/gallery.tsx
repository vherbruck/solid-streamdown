import { type Component, For } from "solid-js";
import { Dynamic } from "solid-js/web";

// Every snippet the guide shows is a module here exporting a default
// component, as is every smoke-test fixture. Rendering them all keeps each
// one built and smoke-tested.
const modules = import.meta.glob<{ default: Component }>(
  ["./snippets/**/*.tsx", "./fixtures/*.tsx"],
  { eager: true }
);

const snippets = Object.entries(modules)
  .map(([path, module]) => ({
    id: path.replace(/^\.\/(snippets\/)?/, "").replace(/\.tsx$/, ""),
    component: module.default,
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

export const Gallery = () => (
  <main class="mx-auto max-w-3xl space-y-12 p-6">
    <h1 class="font-semibold text-2xl">solid-streamdown examples</h1>
    <For each={snippets}>
      {(snippet) => (
        <section data-example={snippet.id} id={snippet.id}>
          <h2 class="mb-4 font-mono text-muted-foreground text-sm">{snippet.id}</h2>
          <Dynamic component={snippet.component} />
        </section>
      )}
    </For>
  </main>
);
