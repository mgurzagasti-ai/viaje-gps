import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "scrypt";
const SCRYPT_KEY_LENGTH = 64;

export function isPasswordHashed(value: string) {
  return value.startsWith(`${HASH_PREFIX}:`);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedValue: string) {
  if (!isPasswordHashed(storedValue)) {
    return password === storedValue;
  }

  const [, salt, storedKey] = storedValue.split(":");

  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  const storedBuffer = Buffer.from(storedKey, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedBuffer);
}
