import { Streamdown } from "solid-streamdown";

export default function NoMailtoLinks() {
  return (
    <Streamdown disableAutolinkProtocols={["mailto"]}>
      {"Contact us at hello@example.com or visit https://example.com"}
    </Streamdown>
  );
}
