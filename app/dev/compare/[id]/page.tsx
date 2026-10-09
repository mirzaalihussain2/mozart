import Link from "next/link";
import { notFound } from "next/navigation";
import { SCREEN_LIST } from "@/lib/dev/screen-list";

export function generateStaticParams() {
  return SCREEN_LIST.map((s) => ({ id: s.id }));
}

export default async function ComparePage({ params }: PageProps<"/dev/compare/[id]">) {
  const { id } = await params;
  const index = SCREEN_LIST.findIndex((s) => s.id === id);
  if (index < 0) notFound();
  const info = SCREEN_LIST[index];
  const prev = SCREEN_LIST[index - 1];
  const next = SCREEN_LIST[index + 1];

  return (
    // Escapes the app's 390 px column so both frames fit side by side.
    <main className="fixed inset-0 overflow-auto bg-[#0b0b0b] p-6">
      <header className="mb-4 flex items-center gap-4 text-sm">
        <Link href="/dev/screens" className="text-text-secondary hover:text-text">
          All screens
        </Link>
        <span className="font-bold">
          {info.id} · {info.title}
        </span>
        <span className="ml-auto flex gap-4">
          {prev ? <Link href={`/dev/compare/${prev.id}`}>← {prev.id}</Link> : null}
          {next ? <Link href={`/dev/compare/${next.id}`}>{next.id} →</Link> : null}
        </span>
      </header>
      <div className="flex gap-6">
        <figure className="m-0">
          <figcaption className="text-text-secondary mb-2 text-xs">App</figcaption>
          <iframe
            src={`/dev/screens/${id}`}
            title={`${id} app`}
            width={390}
            height={844}
            className="border-raised block border"
          />
        </figure>
        <figure className="m-0">
          <figcaption className="text-text-secondary mb-2 text-xs">Design</figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element -- dev-only, served raw from docs/ */}
          <img src={`/dev/designs/${id}`} alt={`${id} design`} width={390} height={844} className="border-raised block border" />
        </figure>
      </div>
    </main>
  );
}
