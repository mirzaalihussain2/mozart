import Link from "next/link";
import { SCREEN_LIST } from "@/lib/dev/screen-list";
import { BUILT } from "./registry";

export const metadata = { title: "Screens · Mozart dev" };

export default function ScreensIndex() {
  return (
    <main className="px-5 py-10">
      <h1 className="text-2xl font-bold">Screens</h1>
      <p className="text-text-secondary mt-1 text-sm">
        Each screen in its design state. “Compare” shows it beside the design PNG.
      </p>
      <ol className="mt-6 flex flex-col">
        {SCREEN_LIST.map((s) => (
          <li key={s.id} className="border-raised flex items-center gap-3 border-b py-2.5 text-sm">
            <span className="text-text-secondary w-12 font-mono">{s.id}</span>
            <Link href={`/dev/screens/${s.id}`} className="flex-1 underline-offset-2 hover:underline">
              {s.title}
              {BUILT.has(s.id) ? null : <span className="text-text-secondary"> · not built</span>}
            </Link>
            <Link href={`/dev/compare/${s.id}`} className="text-text-secondary hover:text-text">
              Compare
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
