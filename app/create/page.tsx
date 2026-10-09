import { CreateHome } from "@/components/creation/CreateHome";
import { requireUser } from "@/lib/server/session";

// 01-02 Create home.
export const instant = false;

export default async function CreatePage() {
  const user = await requireUser();
  return <CreateHome live initial={user.firstName.slice(0, 1).toUpperCase()} avatarUrl={user.avatarUrl} />;
}
