import { mermaid } from "@solid-streamdown/mermaid";
import { Show } from "solid-js";
import {
  type DefaultComponents,
  defaultComponents,
  Streamdown,
  useIsCodeFenceIncomplete,
} from "solid-streamdown";

const MermaidAwareCode: DefaultComponents["code"] = (props) => {
  const isIncomplete = useIsCodeFenceIncomplete();
  const isMermaid = () => props.class?.includes("language-mermaid") ?? false;

  return (
    <Show
      fallback={<defaultComponents.code {...props} />}
      when={isMermaid() && isIncomplete()}
    >
      <div class="flex h-48 animate-pulse items-center justify-center rounded-lg bg-muted">
        <span class="text-muted-foreground">Loading diagram...</span>
      </div>
    </Show>
  );
};

const markdown = "```mermaid\ngraph TD\n    A[Stream] --> B[Diagram]\n```";

export default function IncompleteFence() {
  return (
    <Streamdown components={{ code: MermaidAwareCode }} plugins={{ mermaid }}>
      {markdown}
    </Streamdown>
  );
}
