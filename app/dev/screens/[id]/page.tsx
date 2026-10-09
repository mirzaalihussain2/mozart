import { devToolsOnly } from "@/lib/server/dev-gate";
import { notFound } from "next/navigation";
import { SCREEN_LIST } from "@/lib/dev/screen-list";
import { SCREENS } from "../registry";

// Dev tooling: allowed to block on params.
export const instant = false;

export default async function ScreenPage({ params }: PageProps<"/dev/screens/[id]">) {
  await devToolsOnly();
  const { id } = await params;
  const info = SCREEN_LIST.find((s) => s.id === id);
  if (!info) notFound();
  const render = SCREENS[id];
  if (!render) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 text-center">
        <p className="text-text-secondary">
          {id} · {info.title}
          <br />
          not built yet
        </p>
      </main>
    );
  }
  return render();
}
