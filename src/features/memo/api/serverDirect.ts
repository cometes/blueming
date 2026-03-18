import "server-only";
import { getDb } from "@/app/api/_lib/admin";
import {
	COLLECTION_NAME,
	REPLY_COLLECTION,
	MAX_LIMIT,
	formatTimestamp,
	toMemoItem,
	toMemoReply,
	matchesQuery,
	parsePositiveInt,
} from "@/app/api/_lib/memo";
import type { AuthContext } from "@/app/api/_lib/auth";
import type { MemoListParams, MemoListResponse, MemoDetail, MemoVisibility } from "@/features/memo/types";

export async function fetchMemoListDirect(
	params: MemoListParams = {}
): Promise<MemoListResponse> {
	try {
		const db = getDb();
		const limit = Math.min(parsePositiveInt(params.limit, 24), MAX_LIMIT);
		const page = parsePositiveInt(params.page, 1);
		const query = (params.query ?? "").trim().toLowerCase();

		const snapshot = await db
			.collection(COLLECTION_NAME)
			.orderBy("createdAt", "desc")
			.get();

		if (snapshot.empty) {
			return { items: [], total: 0, page, limit };
		}

		const allRawItems = snapshot.docs.map(toMemoItem);
		const filteredRaw = query
			? allRawItems.filter((item) => matchesQuery(item, query))
			: allRawItems;
		const total = filteredRaw.length;
		const startIndex = (page - 1) * limit;
		const items = filteredRaw.slice(startIndex, startIndex + limit) as MemoListResponse["items"];

		return { items, total, page, limit };
	} catch {
		return {
			items: [],
			total: 0,
			page: params.page ?? 1,
			limit: params.limit ?? 24,
		};
	}
}

export async function fetchMemoDetailDirect(
	id: string,
	authContext?: AuthContext | null
): Promise<MemoDetail | null> {
	try {
		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();

		if (!snapshot.exists) return null;

		const data = (snapshot.data() || {}) as Record<string, unknown>;
		const visibility = ((data.visibility as string) || "public") as MemoVisibility;
		const authorId =
			typeof data.authorId === "string" ? data.authorId : null;
		const isOwner =
			Boolean(authorId) && authContext?.uid === authorId;
		const isAdmin = Boolean(authContext?.isAdmin);
		const canBypass = isOwner || isAdmin;

		if (visibility === "protected" && !canBypass) {
			return {
				id: snapshot.id,
				title: (data.title as string) || "",
				content: null,
				visibility,
				author: data.author || null,
				authorId,
				tags: Array.isArray(data.tags) ? data.tags : [],
				imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
				replyCount: (data.replyCount as number) || 0,
				createdAt: formatTimestamp(data.createdAt),
				updatedAt: formatTimestamp(data.updatedAt),
				requiresPassword: true,
				replies: [],
			};
		}

		if (visibility === "secret" && !canBypass) {
			return {
				id: snapshot.id,
				title: (data.title as string) || "",
				content: null,
				visibility,
				author: data.author || null,
				authorId,
				tags: Array.isArray(data.tags) ? data.tags : [],
				imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
				replyCount: (data.replyCount as number) || 0,
				createdAt: formatTimestamp(data.createdAt),
				updatedAt: formatTimestamp(data.updatedAt),
				requiresSecretAccess: true,
				replies: [],
			};
		}

		const repliesSnapshot = await docRef
			.collection(REPLY_COLLECTION)
			.orderBy("createdAt", "asc")
			.get();
		const replies = repliesSnapshot.docs.map(toMemoReply);

		return {
			id: snapshot.id,
			title: (data.title as string) || "",
			content: (data.content as string) || "",
			visibility,
			author: data.author || null,
			authorId,
			tags: Array.isArray(data.tags) ? data.tags : [],
			imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
			replyCount: (data.replyCount as number) || replies.length,
			createdAt: formatTimestamp(data.createdAt),
			updatedAt: formatTimestamp(data.updatedAt),
			replies,
		};
	} catch {
		return null;
	}
}
