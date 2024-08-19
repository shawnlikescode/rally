import { api } from "~/trpc/server";

export default function Test() {
  const user = api.post.sessionOnServer();

  return <span>{user}</span>;
}
