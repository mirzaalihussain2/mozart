// Where audio may keep playing (milestone 6): the player itself and the two
// pages with the mini player. Anywhere else pauses (the track stays loaded so
// the mini player can resume it).

export function shouldKeepPlaying(pathname: string): boolean {
  return /^\/track\/[^/]+\/?$/.test(pathname) || /^\/(create|library)\/?$/.test(pathname);
}

/** The pages that show the mini player when a track is loaded. */
export function showsMiniPlayer(pathname: string): boolean {
  return /^\/(create|library)\/?$/.test(pathname);
}
