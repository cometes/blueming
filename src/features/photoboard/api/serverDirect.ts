import "server-only";
import { getDb } from "@/app/api/_lib/admin";
import {
	COLLECTION_NAME,
	MAX_LIMIT,
	formatTimestamp,
	toPhotoBoardAuthor,
	parsePositiveInt,
} from "@/app/api/_lib/photoboard";

export type PhotoboardPostItem = {
	id: string;
	author: ReturnType<typeof toPhotoBoardAuthor>;
	createdAt: string;
	imageUrl: string;
	caption: string;
	likeCount: number;
	tags: string[];
};

export async function fetchPhotoboardPostsDirect(
	limit = 18
): Promise<PhotoboardPostItem[]> {
	try {
		const db = getDb();
		const resolvedLimit = Math.min(parsePositiveInt(limit, 18), MAX_LIMIT);
		const snapshot = await db
			.collection(COLLECTION_NAME)
			.orderBy("createdAt", "desc")
			.limit(resolvedLimit)
			.get();

		return snapshot.docs.map((doc) => {
			const data = doc.data() as Record<string, unknown>;
			return {
				id: doc.id,
				author: toPhotoBoardAuthor(data),
				createdAt: formatTimestamp(data.createdAt) ?? "",
				imageUrl: (data.imageUrl as string) || "",
				caption: (data.caption as string) || "",
				likeCount: Number(data.likeCount || 0),
				tags: Array.isArray(data.tags) ? data.tags : [],
			};
		});
	} catch {
		return [];
	}
}
