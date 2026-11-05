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
