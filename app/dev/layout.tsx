import { devToolsOnly } from "@/lib/server/dev-gate";

// Dev tooling: blocks on the request so the production check runs per request.
export const instant = false;

export default async function DevLayout({ children }: LayoutProps<"/dev">) {
  await devToolsOnly();
  return children;
}
