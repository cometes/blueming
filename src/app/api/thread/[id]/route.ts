import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { getAuthContext, requireAuth } from "@/app/api/_lib/auth";
import {
	COLLECTION_NAME,
	TIMELINE_CAP,
	deleteQueryInBatches,
	normalizeContent,
	normalizeImageUrls,
	normalizeTags,
	toThreadItem,
} from "@/app/api/_lib/thread";
import { extractFirstYouTubeVideoIdFromContent } from "@/shared/lib/youtube";
import { validateMentions } from "@/app/api/_lib/mentions";

export const runtime = "nodejs";

/**
 * GET /api/thread/[id] — 스레드 상세: 루트 + 타임라인(rootId==루트, createdAt asc).
 * 답글 id로 접근하면 루트를 로드하고 focusId로 알려준다(클라 스크롤).
 * member 스레드 + 비회원 → requiresMemberAccess 게이트.
 */
export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> },
) {
	const { id } = await params;
	if (!id) {
		return jsonError(400, "글 ID가 필요합니다.");
	}

	try {
		const db = getDb();
		const auth = await getAuthContext();
		const viewerIsMember = Boolean(auth);

		const snapshot = await db.collection(COLLECTION_NAME).doc(id).get();
		if (!snapshot.exists) {
			return jsonError(404, "글을 찾을 수 없습니다.");
		}
		const data = snapshot.data() || {};

		// 답글 id로 진입 시 루트로 승격
		const rootId = (data.rootId as string) || id;
		const rootSnapshot =
			rootId === id
				? snapshot
				: await db.collection(COLLECTION_NAME).doc(rootId).get();
		if (!rootSnapshot.exists) {
			return jsonError(404, "글을 찾을 수 없습니다.");
		}

		const rootData = rootSnapshot.data() || {};
		if (rootData.visibility === "member" && !viewerIsMember) {
			return jsonOk({ requiresMemberAccess: true, root: null, replies: [] });
		}

		const repliesSnapshot = await db
			.collection(COLLECTION_NAME)
			.where("rootId", "==", rootId)
			.orderBy("createdAt", "asc")
			.limit(TIMELINE_CAP)
			.get();

		return jsonOk({
			requiresMemberAccess: false,
			root: toThreadItem(rootSnapshot, { viewerIsMember }),
			replies: repliesSnapshot.docs.map((doc) =>
				toThreadItem(doc, { viewerIsMember }),
			),
			focusId: rootId === id ? null : id,
		});
	} catch (error) {
		if ((error as { code?: number })?.code === 9) {
			console.error("Thread detail index missing:", error);
			return jsonError(
				500,
				"Firestore 인덱스가 아직 준비되지 않았습니다. firestore.indexes.json을 배포해주세요.",
			);
		}
		console.error("Error fetching thread detail:", error);
		return jsonError(500, "스레드를 불러오지 못했습니다.");
	}
}

/** PATCH — 작성자 또는 관리자. content/tags/imageUrls만 수정 (visibility는 v1 제외) */
export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> },
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}
	const { id } = await params;
	if (!id) {
		return jsonError(400, "글 ID가 필요합니다.");
	}

	try {
		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "글을 찾을 수 없습니다.");
		}
		const data = snapshot.data() || {};
		const isOwner = data.authorId === auth.auth.uid;
		if (!isOwner && !auth.auth.isAdmin) {
			return jsonError(403, "수정 권한이 없습니다.");
		}

		const body = await req.json();
		const content = normalizeContent(body?.content);
		if (!content) {
			return jsonError(400, "내용을 입력해주세요.");
		}
		const imageUrls = normalizeImageUrls(body?.imageUrls);
		const tags = normalizeTags(body?.tags);
		const mentions = await validateMentions(body?.mentions, content);

		await docRef.update({
			content,
			imageUrls,
			tags,
			mentions,
			youtubeVideoId: extractFirstYouTubeVideoIdFromContent(content) ?? null,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		const updated = await docRef.get();
		return jsonOk(toThreadItem(updated, { viewerIsMember: true }));
	} catch (error) {
		console.error("Error updating thread post:", error);
		return jsonError(500, "글을 수정하지 못했습니다.");
	}
}

/**
 * DELETE — 작성자 또는 관리자.
 * 루트 삭제 = 답글 캐스케이드 삭제 / 답글 삭제 = 루트 replyCount 감소.
 */
export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> },
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}
	const { id } = await params;
	if (!id) {
		return jsonError(400, "글 ID가 필요합니다.");
	}

	try {
		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "글을 찾을 수 없습니다.");
		}
		const data = snapshot.data() || {};
		const isOwner = data.authorId === auth.auth.uid;
		if (!isOwner && !auth.auth.isAdmin) {
			return jsonError(403, "삭제 권한이 없습니다.");
		}

		const rootId = (data.rootId as string) || null;
		if (!rootId) {
			// 루트: 답글 전체 캐스케이드 삭제 후 본문 삭제
			await deleteQueryInBatches(
				db.collection(COLLECTION_NAME).where("rootId", "==", id),
			);
			await docRef.delete();
		} else {
			await db.runTransaction(async (tx) => {
				tx.delete(docRef);
				tx.update(db.collection(COLLECTION_NAME).doc(rootId), {
					replyCount: admin.firestore.FieldValue.increment(-1),
				});
			});
		}

		return jsonOk({ id });
	} catch (error) {
		console.error("Error deleting thread post:", error);
		return jsonError(500, "글을 삭제하지 못했습니다.");
	}
}
