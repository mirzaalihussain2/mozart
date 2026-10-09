import { SpotifyIcon } from "@/components/icons/SpotifyIcon";

// 01-01 Landing / Sign in. Values from docs/designs/html/CfLanding.dc.html.

export function LandingView() {
  return (
    <main className="relative h-dvh min-h-[680px] overflow-hidden">
      <div className="absolute top-[60px] left-6 text-2xl leading-[30px] font-bold tracking-[-0.01em]">Mozart</div>

      <StackedArtwork />

      <h1 className="absolute top-[calc(50%+136px)] right-6 left-6 m-0 text-center text-[32px] leading-[1.15] font-bold tracking-[-0.01em]">
        Make music from what you already love.
      </h1>

      <div className="absolute right-6 bottom-10 left-6 flex flex-col gap-3">
        <a
          href="/auth/spotify/login"
          className="bg-accent text-on-accent flex h-14 items-center justify-center gap-2.5 rounded-full text-[17px] leading-tight font-semibold"
        >
          <SpotifyIcon />
          Connect Spotify to get started
        </a>
        <form action="/auth/dummy" method="post">
          <button
            type="submit"
            className="bg-raised text-text flex h-14 w-full cursor-pointer items-center justify-center rounded-full text-[17px] leading-tight font-semibold"
          >
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}

// Sizes include the 1px border: the design boxes are content-box (140/170 + 2).
function StackedArtwork() {
  return (
    <div aria-hidden="true" className="absolute top-1/2 left-1/2 h-[220px] w-[300px] -translate-1/2">
      <div className="bg-surface border-raised rounded-art-lg absolute top-[45px] left-0 size-[142px] -rotate-8 border" />
      <div className="bg-surface border-raised rounded-art-lg absolute top-[45px] left-[160px] size-[142px] rotate-8 border" />
      <div className="bg-raised border-border rounded-art-lg absolute top-[25px] left-[65px] flex size-[172px] items-center justify-center border">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#737373"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
    </div>
  );
}
