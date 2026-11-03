import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nconst user = await getUser(id);\nconst profile = await getProfile(user);\n```";

export default function NoLineNumbers() {
  return <Streamdown lineNumbers={false}>{markdown}</Streamdown>;
}
