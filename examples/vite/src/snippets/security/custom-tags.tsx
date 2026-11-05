import { Streamdown } from "solid-streamdown";

const NoteBadge = (props: { noteId?: string }) => (
  <span class="rounded bg-muted px-1 text-sm">note #{props.noteId}</span>
);

const UserMention = (props: { userId?: string }) => (
  <span class="font-medium text-primary">@user-{props.userId}</span>
);

const markdown = 'Ask <mention user_id="42">Ada</mention> about <ref note_id="7">the plan</ref>.';

export default function CustomTags() {
  return (
    <Streamdown
      allowedTags={{
        ref: ["note_id"], // Allow <ref> with note_id attribute
        mention: ["user_id"], // Allow <mention> with user_id attribute
      }}
      components={{
        ref: (props: { note_id?: string }) => <NoteBadge noteId={props.note_id} />,
        mention: (props: { user_id?: string }) => <UserMention userId={props.user_id} />,
      }}
    >
      {markdown}
    </Streamdown>
  );
}
