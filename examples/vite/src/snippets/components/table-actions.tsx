import {
  Streamdown,
  TableCopyDropdown,
  TableDownloadButton,
  TableDownloadDropdown,
} from "solid-streamdown";

const markdown = "| Plan | Price |\n| --- | --- |\n| Free | $0 |\n| Pro | $20 |";

export default function Page() {
  return (
    <Streamdown
      components={{
        table: (props) => (
          <div data-streamdown="table-wrapper">
            <div class="flex items-center justify-end gap-1">
              <TableCopyDropdown />
              <TableDownloadDropdown />
              <TableDownloadButton format="csv" />
            </div>
            <table class={`${props.class ?? ""} w-full border border-border`}>{props.children}</table>
          </div>
        ),
      }}
    >
      {markdown}
    </Streamdown>
  );
}
