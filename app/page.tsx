import { redirect } from "next/navigation";
import { LandingView } from "@/components/landing/LandingView";
import { getCurrentUser } from "@/lib/server/session";

// Reads the session before rendering so signed-in visitors get a real redirect.
export const instant = false;

export default async function LandingPage() {
  if (await getCurrentUser()) redirect("/create");
  return <LandingView />;
}
