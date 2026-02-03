import "server-only";
import crypto from "crypto";
import { getDb } from "@/app/api/_lib/admin";

export const PIN_REGEX = /^\d{4}$/;
export const MAX_MESSAGE_LENGTH = 500;
export const MAX_NAME_LENGTH = 20;
export const MAX_IMAGE_COUNT = 8;
export const HASH_ITERATIONS = 100_000;
export const HASH_KEYLEN = 64;
export const HASH_DIGEST = "sha256";

const ALLOWED_PROTOCOLS = ["http:", "https:"];

export const updateLibraryCommentCount = async (
	postId: string,
	delta: number
) => {
	const db = getDb();
	const docRef = db.collection("library").doc(postId);
	await db.runTransaction(async (tx) => {
		const snapshot = await tx.get(docRef);
		if (!snapshot.exists) return;
		const data = snapshot.data() || {};
		const current = typeof data.commentCount === "number" ? data.commentCount : 0;
		const next = Math.max(0, current + delta);
		tx.update(docRef, { commentCount: next });
	});
};

export const hashPin = (pin: string, salt?: string) => {
	const nextSalt = salt ?? crypto.randomBytes(16).toString("hex");
	const hash = crypto
		.pbkdf2Sync(pin, nextSalt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST)
		.toString("hex");
	return { salt: nextSalt, hash };
};

export const verifyPin = (pin: string, salt: string, hash: string) =>
	hashPin(pin, salt).hash === hash;

export const parsePositiveInt = (value: unknown, fallback: number) => {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	if (Number.isNaN(parsed) || parsed <= 0) return fallback;
	return parsed;
};

export const normalizeMessage = (value: unknown) => {
	if (typeof value !== "string") return "";
	return value.trim().slice(0, MAX_MESSAGE_LENGTH);
};

export const normalizeName = (value: unknown) => {
	if (typeof value !== "string") return "";
	return value.trim().slice(0, MAX_NAME_LENGTH);
};

export const normalizeBoolean = (value: unknown) => value === true;

export const normalizeImageUrls = (value: unknown) => {
	if (!Array.isArray(value)) return [];
	const urls = value
		.map((item) => {
			if (typeof item !== "string") return "";
			try {
				const parsed = new URL(item);
				return ALLOWED_PROTOCOLS.includes(parsed.protocol) ? item : "";
			} catch {
				return "";
			}
		})
		.filter((url) => url.length > 0);
	return Array.from(new Set(urls)).slice(0, MAX_IMAGE_COUNT);
};
