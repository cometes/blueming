import "server-only";
import { getDb } from "@/app/api/_lib/admin";
import {
	parsePositiveInt as _parsePositiveInt,
	formatTimestamp as _formatTimestamp,
	normalizeTags as _normalizeTags,
	normalizeImageUrls as _normalizeImageUrls,
	normalizeString,
} from "@/app/api/_lib/normalizers";

export const COLLECTION_NAME = "memos";
export const REPLY_COLLECTION = "replies";
export const MAX_LIMIT = 50;
export const MAX_TITLE_LENGTH = 120;
export const MAX_CONTENT_LENGTH = 5000;
export const MAX_TAGS = 10;
export const MAX_IMAGE_COUNT = 4;

// ── 공통 유틸 re-export (기존 import 경로 호환 유지) ────────────────────────
export const parsePositiveInt = (value: unknown, fallback: number) =>
	_parsePositiveInt(value, fallback);

export const formatTimestamp = (value: unknown) => _formatTimestamp(value);

// ── feature 전용 정규화 (상수를 고정하여 단순 호출) ─────────────────────────
export const normalizeTitle = (value: unknown) =>
	normalizeString(value, MAX_TITLE_LENGTH);

export const normalizeContent = (value: unknown) =>
	normalizeString(value, MAX_CONTENT_LENGTH);

export const normalizeTags = (value: unknown) =>
	_normalizeTags(value, MAX_TAGS);

export const normalizeImageUrls = (value: unknown) =>
	_normalizeImageUrls(value, MAX_IMAGE_COUNT);

export const normalizeVisibility = (value: unknown) => {
	if (value === "secret" || value === "protected") return value;
	return "public";
};

// ── Firestore 변환 ────────────────────────────────────────────────────────────
export const toMemoItem = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
	const data = doc.data() as Record<string, unknown>;
	const visibility = (data.visibility as string) || "public";
	const isLocked = visibility !== "public";
	return {
		id: doc.id,
		title: (data.title as string) || "",
		content: isLocked ? null : (data.content as string) || "",
		visibility,
		author: data.author || null,
		authorId: (data.authorId as string) || null,
		tags: Array.isArray(data.tags) ? data.tags : [],
		imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
		replyCount: (data.replyCount as number) || 0,
		createdAt: formatTimestamp(data.createdAt),
		updatedAt: formatTimestamp(data.updatedAt),
	};
};

export const toMemoItemFromDoc = (doc: FirebaseFirestore.DocumentSnapshot) => {
	const data = (doc.data() || {}) as Record<string, unknown>;
	const visibility = (data.visibility as string) || "public";
	const isLocked = visibility !== "public";
	return {
		id: doc.id,
		title: (data.title as string) || "",
		content: isLocked ? null : (data.content as string) || "",
		visibility,
		author: data.author || null,
		authorId: (data.authorId as string) || null,
		tags: Array.isArray(data.tags) ? data.tags : [],
		imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
		replyCount: (data.replyCount as number) || 0,
		createdAt: formatTimestamp(data.createdAt),
		updatedAt: formatTimestamp(data.updatedAt),
	};
};

export const toMemoReply = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
	const data = doc.data();
	return {
		id: doc.id,
		content: data.content || "",
		author: data.author || null,
		createdAt: formatTimestamp(data.createdAt),
		updatedAt: formatTimestamp(data.updatedAt),
		imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
	};
};

export const matchesQuery = (item: ReturnType<typeof toMemoItem>, query: string) => {
	if (!query) return true;
	const haystack = [
		item.title,
		item.content || "",
		(item.author as { name?: string } | null)?.name || "",
		...(Array.isArray(item.tags) ? item.tags : []),
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
	return haystack.includes(query);
};

export const deleteCollectionInBatches = async (
	collectionRef: FirebaseFirestore.CollectionReference
) => {
	const db = getDb();
	let snapshot = await collectionRef.limit(500).get();
	while (!snapshot.empty) {
		const batch = db.batch();
		snapshot.docs.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();
		snapshot = await collectionRef.limit(500).get();
	}
};
