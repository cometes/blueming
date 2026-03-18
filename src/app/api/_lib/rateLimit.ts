import "server-only";
import crypto from "crypto";
import admin from "firebase-admin";
import { getDb } from "@/app/api/_lib/admin";

export interface RateLimitOptions {
	/** Firestore 컬렉션 이름 (기본값: "rateLimits") */
	collection?: string;
	/** 동일 키 쿨다운(ms). 기본값 10초 */
	cooldownMs?: number;
	/** 분당 최대 요청 수. 기본값 10 */
	minuteLimit?: number;
	/** 시간당 최대 요청 수. 기본값 60 */
	hourLimit?: number;
}

export type RateLimitResult =
	| { ok: true }
	| { ok: false; reason: "cooldown" | "minute" | "hour"; retryAfterMs: number };

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

/**
 * IP 또는 UID를 기반으로 Rate Limit 키를 생성합니다.
 */
export const buildRateLimitKey = (
	authContext: { uid?: string | null } | null,
	req: Request,
	prefix: string
): string => {
	if (authContext?.uid) {
		return `${prefix}:uid:${authContext.uid}`;
	}
	const forwarded = req.headers.get("x-forwarded-for");
	const ip = forwarded ? forwarded.split(",")[0]?.trim() ?? "" : "";
	const hashed = crypto.createHash("sha256").update(ip || "unknown").digest("hex");
	return `${prefix}:ip:${hashed}`;
};

/**
 * Firestore 기반 범용 Rate Limiter.
 * cooldown → 분당 → 시간당 순으로 검사합니다.
 */
export const checkRateLimit = async (
	key: string,
	options: RateLimitOptions = {}
): Promise<RateLimitResult> => {
	const {
		collection = "rateLimits",
		cooldownMs = 10_000,
		minuteLimit = 10,
		hourLimit = 60,
	} = options;

	const db = getDb();
	const docRef = db.collection(collection).doc(key);
	const now = Date.now();

	return db.runTransaction(async (tx) => {
		const snapshot = await tx.get(docRef);
		const data = snapshot.exists ? snapshot.data() || {} : {};

		let minuteWindowStart = Number(data.minuteWindowStart ?? 0);
		let hourWindowStart = Number(data.hourWindowStart ?? 0);
		let minuteCount = Number(data.minuteCount ?? 0);
		let hourCount = Number(data.hourCount ?? 0);
		const lastAt = Number(data.lastAt ?? 0);

		if (now - lastAt < cooldownMs) {
			return {
				ok: false,
				reason: "cooldown",
				retryAfterMs: cooldownMs - (now - lastAt),
			} as RateLimitResult;
		}

		if (now - minuteWindowStart >= MINUTE_MS) {
			minuteWindowStart = now;
			minuteCount = 0;
		}
		if (now - hourWindowStart >= HOUR_MS) {
			hourWindowStart = now;
			hourCount = 0;
		}

		if (minuteCount >= minuteLimit) {
			return {
				ok: false,
				reason: "minute",
				retryAfterMs: MINUTE_MS - (now - minuteWindowStart),
			} as RateLimitResult;
		}
		if (hourCount >= hourLimit) {
			return {
				ok: false,
				reason: "hour",
				retryAfterMs: HOUR_MS - (now - hourWindowStart),
			} as RateLimitResult;
		}

		tx.set(
			docRef,
			{
				minuteWindowStart,
				hourWindowStart,
				minuteCount: minuteCount + 1,
				hourCount: hourCount + 1,
				lastAt: now,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true }
		);

		return { ok: true } as RateLimitResult;
	});
};
