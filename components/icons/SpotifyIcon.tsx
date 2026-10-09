// Stroke Spotify mark from docs/designs/html/CfLanding.dc.html.
export function SpotifyIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M7 9.5c3.5-1 7-0.7 10 1" />
      <path d="M7.5 12.8c3-0.8 5.8-0.5 8.5 0.9" />
      <path d="M8 15.8c2.4-0.6 4.6-0.4 6.6 0.7" />
    </svg>
  );
}
