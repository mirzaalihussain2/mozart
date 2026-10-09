import "server-only";
import { safeReturnTo } from "../../return-to";
import { completeSignIn } from "./complete-sign-in";
import { pickDummyPersona, upsertPersona } from "./personas";

/**
 * Dummy sign-in (POST /auth/dummy, and /auth/spotify/login as the silent
 * fallback): validate returnTo → pick the persona → upsert → completeSignIn.
 */
export async function signInWithDummy(rawReturnTo: unknown): Promise<Response> {
  const returnTo = safeReturnTo(rawReturnTo);
  const persona = await pickDummyPersona(returnTo);
  const userId = await upsertPersona(persona);
  return completeSignIn({ userId, returnTo });
}

export { isSameOrigin, seeOther } from "./http";
