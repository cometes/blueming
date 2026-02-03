import "server-only";
import { getDb } from "@/app/api/_lib/admin";

export const COLLECTION_NAME = "memos";
export const REPLY_COLLECTION = "replies";
export const MAX_LIMIT = 50;
export const MAX_TITLE_LENGTH = 120;
export const MAX_CONTENT_LENGTH = 5000;
export const MAX_TAGS = 10;
export const MAX_IMAGE_COUNT = 4;

export const parsePositiveInt = (value: unknown, fallback: number) => {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	if (Number.isNaN(parsed) || parsed <= 0) return fallback;
	return parsed;
};

export const normalizeTitle = (value: unknown) => {
	if (typeof value !== "string") return "";
	return value.trim().slice(0, MAX_TITLE_LENGTH);
};

export const normalizeContent = (value: unknown) => {
	if (typeof value !== "string") return "";
	return value.trim().slice(0, MAX_CONTENT_LENGTH);
};

export const normalizeTags = (value: unknown) => {
	if (!Array.isArray(value)) return [];
	const tags = value
		.map((tag) => (typeof tag === "string" ? tag.trim() : ""))
		.filter(Boolean)
		.map((tag) => tag.replace(/^#/, ""));
	return Array.from(new Set(tags)).slice(0, MAX_TAGS);
};

export const normalizeVisibility = (value: unknown) => {
	if (value === "secret" || value === "protected") return value;
	return "public";
};

export const normalizeImageUrls = (value: unknown) => {
	if (!Array.isArray(value)) return [];
	const urls = value
		.map((item) => {
			if (typeof item !== "string") return "";
			try {
				const parsed = new URL(item);
				return parsed.protocol.startsWith("http") ? item : "";
			} catch {
				return "";
			}
		})
		.filter((url) => url.length > 0);
	return Array.from(new Set(urls)).slice(0, MAX_IMAGE_COUNT);
};

export const formatTimestamp = (value: unknown) => {
	if (!value) return null;
	if (typeof (value as { toDate?: () => Date }).toDate === "function") {
		const date = (value as { toDate: () => Date }).toDate();
		return Number.isNaN(date.getTime()) ? null : date.toISOString();
	}
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value.toISOString();
	}
	return null;
};

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
