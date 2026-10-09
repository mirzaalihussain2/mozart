import Link from "next/link";
import { CreateTabIcon, LibraryTabIcon } from "@/components/icons";

/** Create / Library tab bar — only on the Create home and Library (CfHome, CfLibrary). */
export function TabBar({ active }: { active: "create" | "library" }) {
  const tab = (isActive: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-1 text-xs ${isActive ? "text-text font-bold" : "text-text-secondary font-medium"}`;
  return (
    <nav aria-label="Main" className="border-raised box-content flex h-[63px] shrink-0 border-t pb-[max(8px,env(safe-area-inset-bottom))]">
      <Link href="/create" aria-current={active === "create" ? "page" : undefined} className={tab(active === "create")}>
        <CreateTabIcon strokeWidth={active === "create" ? 2 : 1.8} />
        Create
      </Link>
      <Link href="/library" aria-current={active === "library" ? "page" : undefined} className={tab(active === "library")}>
        <LibraryTabIcon strokeWidth={active === "library" ? 2 : 1.8} />
        Library
      </Link>
    </nav>
  );
}
