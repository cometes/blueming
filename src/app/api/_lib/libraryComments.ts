import "server-only";
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

// ── Firestore 유틸 ────────────────────────────────────────────────────────────
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
