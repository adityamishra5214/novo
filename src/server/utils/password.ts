import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Hash a plaintext password using scrypt with a random salt.
 * Returns the format: `salt:hash` (hex encoded).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a stored `salt:hash` string.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, 'hex');
  const verifyBuffer = scryptSync(password, salt, 64);
  if (hashBuffer.length !== verifyBuffer.length) return false;
  return timingSafeEqual(hashBuffer, verifyBuffer);
}

/**
 * Generate a cryptographically secure session token.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}
