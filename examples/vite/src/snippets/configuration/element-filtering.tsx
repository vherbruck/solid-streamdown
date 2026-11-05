import { Streamdown } from "solid-streamdown";

const markdown = `### A small heading

Some *emphasis* and a [link](https://example.com).

![A red square](data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22red%22%2F%3E%3C%2Fsvg%3E)
`;

export default function Page() {
  return (
    <>
      {/* Only allow paragraphs, links, and emphasis */}
      <Streamdown allowedElements={["p", "a", "em"]}>{markdown}</Streamdown>

      {/* Remove images but keep everything else */}
      <Streamdown disallowedElements={["img"]}>{markdown}</Streamdown>

      {/* Remove images but keep their alt text */}
      <Streamdown disallowedElements={["img"]} unwrapDisallowed>
        {markdown}
      </Streamdown>

      {/* Custom filter: remove all h3+ headings */}
      <Streamdown allowElement={(element) => !["h3", "h4", "h5", "h6"].includes(element.tagName)}>
        {markdown}
      </Streamdown>
    </>
  );
}
