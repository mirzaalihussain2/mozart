import "server-only";
import { createHash, randomBytes } from "node:crypto";

// PKCE (RFC 7636) with S256, and the OAuth `state`.

/** 64 URL-safe characters (within RFC 7636's 43–128). */
export function createVerifier(): string {
  return randomBytes(48).toString("base64url");
}

/** base64url(SHA-256(verifier)). */
export function challengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function createState(): string {
  return randomBytes(16).toString("base64url");
}
