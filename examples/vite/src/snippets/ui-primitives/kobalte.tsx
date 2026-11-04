import { kobalteUi } from "@solid-streamdown/kobalte";
import { Streamdown } from "solid-streamdown";

const markdown = `| Model | Context |
| --- | --- |
| Small | 32k |
| Large | 200k |

Read the [release notes](https://example.com/notes).`;

export default function KobalteControls() {
  return <Streamdown ui={kobalteUi}>{markdown}</Streamdown>;
}
