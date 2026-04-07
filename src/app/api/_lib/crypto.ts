import "server-only";
import crypto from "crypto";

export const HASH_ITERATIONS = 100_000;
export const HASH_KEYLEN = 64;
export const HASH_DIGEST = "sha256";

/**
 * PIN을 PBKDF2로 해싱. salt 미제공 시 무작위 생성.
 */
export const hashPin = (pin: string, salt?: string) => {
	const nextSalt = salt ?? crypto.randomBytes(16).toString("hex");
	const hash = crypto
		.pbkdf2Sync(pin, nextSalt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST)
		.toString("hex");
	return { salt: nextSalt, hash };
};

/**
 * PIN 검증. 저장된 salt + hash와 비교.
 */
export const verifyPin = (pin: string, salt: string, hash: string): boolean =>
	hashPin(pin, salt).hash === hash;
