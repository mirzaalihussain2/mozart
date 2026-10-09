import { ProfileMenu } from "./ProfileMenu";

/**
 * Top of the Create and Library tabs (CfHome): the "Mozart" wordmark with the
 * profile menu, then the tab's title and subtitle.
 */
export function TabHeader({ initial, title, subtitle }: { initial: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-5 px-5 pt-14">
      <div className="flex items-center justify-between">
        <div className="text-[22px] font-bold tracking-[-0.01em]">Mozart</div>
        <ProfileMenu initial={initial} />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-2xl leading-[1.15] font-bold whitespace-nowrap">{title}</h1>
        <p className="text-text-secondary m-0 text-[15px] leading-[1.4] whitespace-nowrap">{subtitle}</p>
      </div>
    </div>
  );
}
