import { mermaid } from "@solid-streamdown/mermaid";
import { type Component, createEffect } from "solid-js";
import { type MermaidErrorComponentProps, Streamdown } from "solid-streamdown";

// #region component
const ErrorWithLogging: Component<MermaidErrorComponentProps> = (props) => {
  createEffect(() => {
    // Log to your error tracking service
    console.error("Mermaid rendering failed:", props.error);
    // Could also send to Sentry, LogRocket, etc.
  });

  return (
    <div class="p-4 text-center">
      <p class="text-muted-foreground">Unable to display diagram</p>
      <button class="mt-2 text-primary text-sm underline" onClick={() => props.retry()} type="button">
        Retry
      </button>
    </div>
  );
};
// #endregion

const markdown = "```mermaid\ngraph LR\n    A[Log] --> B[Track]\n```";

export default function ErrorLogging() {
  return (
    <Streamdown mermaid={{ errorComponent: ErrorWithLogging }} plugins={{ mermaid }}>
      {markdown}
    </Streamdown>
  );
}
