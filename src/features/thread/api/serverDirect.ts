import "server-only";
import admin from "firebase-admin";
import { FieldPath } from "firebase-admin/firestore";
import { getDb } from "@/app/api/_lib/admin";
import {
	COLLECTION_NAME,
	DEFAULT_LIMIT,
	encodeThreadCursor,
	toThreadItem,
} from "@/app/api/_lib/thread";
import type { AuthContext } from "@/app/api/_lib/auth";
import type { ThreadFeedResponse, ThreadPost } from "@/features/thread/types";

/** RSC 초기 데이터용 — 전체 탭 첫 페이지 (HTTP 왕복 없음) */
export async function fetchThreadFeedDirect(
	authContext: AuthContext | null,
): Promise<ThreadFeedResponse> {
	try {
		const db = getDb();
		const snapshot = await db
			.collection(COLLECTION_NAME)
			.orderBy("createdAt", "desc")
			.orderBy(FieldPath.documentId(), "desc")
			.limit(DEFAULT_LIMIT + 1)
			.get();

		const docs = snapshot.docs.slice(0, DEFAULT_LIMIT);
		const items = docs.map((doc) =>
			toThreadItem(doc, { viewerIsMember: Boolean(authContext) }),
		) as unknown as ThreadPost[];
		const last = docs[docs.length - 1];
		const nextCursor =
			snapshot.docs.length > DEFAULT_LIMIT && last
				? encodeThreadCursor({
						c:
							(
								last.get("createdAt") as
									| admin.firestore.Timestamp
									| undefined
							)?.toMillis?.() ?? 0,
						id: last.id,
					})
				: null;

		return { items, nextCursor };
	} catch {
		return { items: [], nextCursor: null };
	}
}
