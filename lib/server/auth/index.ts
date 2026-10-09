import "server-only";
import type { Persona } from "../../config/personas";
import { safeReturnTo } from "../../return-to";
import { completeSignIn } from "./complete-sign-in";
import { pickFallbackPersona, resetPersona } from "./personas";

/**
 * Signs in as a demo persona: validate returnTo → reset their library →
 * completeSignIn (which claims this browser's anonymous tracks afterwards).
 */
export async function signInAsPersona(persona: Persona, rawReturnTo: unknown): Promise<Response> {
  const returnTo = safeReturnTo(rawReturnTo);
  const userId = await resetPersona(persona);
  return completeSignIn({ userId, returnTo });
}

/** Any Spotify failure (and Spotify switched off): Candice, or Derek from one of her tracks. */
export async function signInWithFallback(rawReturnTo: unknown): Promise<Response> {
  const persona = await pickFallbackPersona(safeReturnTo(rawReturnTo));
  return signInAsPersona(persona, rawReturnTo);
}

export { isSameOrigin, seeOther } from "./http";
