import { SomethingNew } from "@/components/creation/SomethingNew";
import { requireUser } from "@/lib/server/session";

// 02-07 Something new.
export const instant = false;

export default async function SomethingNewPage() {
  await requireUser();
  return <SomethingNew />;
}
