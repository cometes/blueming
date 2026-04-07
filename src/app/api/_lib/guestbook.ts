import "server-only";
import crypto from "crypto";
import admin from "firebase-admin";
import { getDb } from "@/app/api/_lib/admin";
import {
	parsePositiveInt as _parsePositiveInt,
	normalizeString,
	normalizeBoolean as _normalizeBoolean,
	normalizeImageUrls as _normalizeImageUrls,
} from "@/app/api/_lib/normalizers";
import { hashPin as _hashPin, verifyPin as _verifyPin } from "@/app/api/_lib/crypto";

export const PIN_REGEX = /^\d{4}$/;
export const MAX_MESSAGE_LENGTH = 500;
export const MAX_NAME_LENGTH = 20;
export const MAX_IMAGE_COUNT = 8;
export const COOLDOWN_MS = 20_000;
export const MINUTE_LIMIT = 5;
export const HOUR_LIMIT = 30;
export const MINUTE_WINDOW_MS = 60_000;
export const HOUR_WINDOW_MS = 3_600_000;

// ── 공통 유틸 re-export (기존 import 경로 호환 유지) ────────────────────────
export const parsePositiveInt = (value: unknown, fallback: number) =>
	_parsePositiveInt(value, fallback);

export const hashPin = (pin: string, salt?: string) => _hashPin(pin, salt);

export const verifyPin = (pin: string, salt: string, hash: string) =>
	_verifyPin(pin, salt, hash);

export const normalizeBoolean = (value: unknown) => _normalizeBoolean(value);

export const normalizeImageUrls = (value: unknown) =>
	_normalizeImageUrls(value, MAX_IMAGE_COUNT);

// ── feature 전용 정규화 ───────────────────────────────────────────────────────
export const normalizeMessage = (value: unknown) =>
	normalizeString(value, MAX_MESSAGE_LENGTH);

export const normalizeName = (value: unknown) =>
	normalizeString(value, MAX_NAME_LENGTH);

// ── IP / Rate limit 유틸 ─────────────────────────────────────────────────────
export const getRequestIp = (req: Request) => {
	const forwarded = req.headers.get("x-forwarded-for");
	if (forwarded && forwarded.length > 0) {
		return forwarded.split(",")[0]?.trim() ?? "";
	}
	return "";
};

export const getRateLimitKey = (
	authContext: { uid?: string | null } | null,
	req: Request
) => {
	if (authContext?.uid) return `uid:${authContext.uid}`;
	const ip = getRequestIp(req) || "unknown";
	const hashed = crypto.createHash("sha256").update(ip).digest("hex");
	return `ip:${hashed}`;
};

export const checkGuestbookRateLimit = async (
	key: string
): Promise<
	| { ok: true }
	| { ok: false; reason: "cooldown" | "minute" | "hour"; retryAfterMs: number }
> => {
	const db = getDb();
	const docRef = db.collection("guestbookRateLimits").doc(key);
	const now = Date.now();
	return db.runTransaction(async (tx) => {
		const snapshot = await tx.get(docRef);
		const data = snapshot.exists ? snapshot.data() || {} : {};
		let minuteWindowStart = Number(data.minuteWindowStart ?? 0);
		let hourWindowStart = Number(data.hourWindowStart ?? 0);
		let minuteCount = Number(data.minuteCount ?? 0);
		let hourCount = Number(data.hourCount ?? 0);
		const lastCreatedAt = Number(data.lastCreatedAt ?? 0);

		if (now - lastCreatedAt < COOLDOWN_MS) {
			return {
				ok: false,
				reason: "cooldown",
				retryAfterMs: COOLDOWN_MS - (now - lastCreatedAt),
			};
		}

		if (now - minuteWindowStart >= MINUTE_WINDOW_MS) {
			minuteWindowStart = now;
			minuteCount = 0;
		}
		if (now - hourWindowStart >= HOUR_WINDOW_MS) {
			hourWindowStart = now;
			hourCount = 0;
		}

		if (minuteCount >= MINUTE_LIMIT) {
			return {
				ok: false,
				reason: "minute",
				retryAfterMs: MINUTE_WINDOW_MS - (now - minuteWindowStart),
			};
		}

		if (hourCount >= HOUR_LIMIT) {
			return {
				ok: false,
				reason: "hour",
				retryAfterMs: HOUR_WINDOW_MS - (now - hourWindowStart),
			};
		}

		tx.set(
			docRef,
			{
				minuteWindowStart,
				hourWindowStart,
				minuteCount: minuteCount + 1,
				hourCount: hourCount + 1,
				lastCreatedAt: now,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true }
		);

		return { ok: true };
	});
};
