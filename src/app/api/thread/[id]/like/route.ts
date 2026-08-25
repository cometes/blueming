import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import {
	COLLECTION_NAME,
	LIKES_COLLECTION,
	likeDocId,
} from "@/app/api/_lib/thread";
import { actorFromAuth, emitNotification } from "@/app/api/_lib/notifications";

export const runtime = "nodejs";

/** POST — 마음에 들어요 (이미 눌렀으면 no-op). 생성 + likeCount 증가 트랜잭션 */
export async function POST(
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
		const postRef = db.collection(COLLECTION_NAME).doc(id);
		const likeRef = db
			.collection(LIKES_COLLECTION)
			.doc(likeDocId(id, auth.auth.uid));

		const result = await db.runTransaction(async (tx) => {
			const postSnapshot = await tx.get(postRef);
			if (!postSnapshot.exists) {
				return null;
			}
			const likeSnapshot = await tx.get(likeRef);
			const currentCount =
				(postSnapshot.get("likeCount") as number | undefined) || 0;
			if (likeSnapshot.exists) {
				// 이미 좋아요 상태 — 멱등 처리
				return { created: false, likeCount: currentCount, post: postSnapshot };
			}
			tx.set(likeRef, {
				postId: id,
				uid: auth.auth.uid,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			tx.update(postRef, {
				likeCount: admin.firestore.FieldValue.increment(1),
			});
			return { created: true, likeCount: currentCount + 1, post: postSnapshot };
		});

		if (!result) {
			return jsonError(404, "글을 찾을 수 없습니다.");
		}

		// 알림 — 새로 눌렀을 때만, 자기 글 제외, 실패 비치명
		if (result.created) {
			try {
				const data = result.post.data() || {};
				const authorId = (data.authorId as string) || null;
				if (authorId && authorId !== auth.auth.uid) {
					const actor = actorFromAuth(auth.auth);
					await emitNotification({
						actor,
						recipients: [authorId],
						type: "threadLike",
						category: "activity",
						message: `${actor.name}님이 회원님의 글을 마음에 들어 합니다`,
						excerpt: String(data.content ?? "") || "이미지 게시글",
						link: `/thread/${id}`,
					});
				}
			} catch (notifyError) {
				console.error("Error emitting thread like notification:", notifyError);
			}
		}

		return jsonOk({ liked: true, likeCount: result.likeCount });
	} catch (error) {
		console.error("Error liking thread post:", error);
		return jsonError(500, "마음에 들어요에 실패했습니다.");
	}
}

/** DELETE — 마음에 들어요 취소 (안 눌렀으면 no-op) */
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
		const postRef = db.collection(COLLECTION_NAME).doc(id);
		const likeRef = db
			.collection(LIKES_COLLECTION)
			.doc(likeDocId(id, auth.auth.uid));

		const result = await db.runTransaction(async (tx) => {
			const postSnapshot = await tx.get(postRef);
			if (!postSnapshot.exists) {
				return null;
			}
			const likeSnapshot = await tx.get(likeRef);
			const currentCount =
				(postSnapshot.get("likeCount") as number | undefined) || 0;
			if (!likeSnapshot.exists) {
				return { likeCount: currentCount };
			}
			tx.delete(likeRef);
			tx.update(postRef, {
				likeCount: admin.firestore.FieldValue.increment(-1),
			});
			return { likeCount: Math.max(0, currentCount - 1) };
		});

		if (!result) {
			return jsonError(404, "글을 찾을 수 없습니다.");
		}
		return jsonOk({ liked: false, likeCount: result.likeCount });
	} catch (error) {
		console.error("Error unliking thread post:", error);
		return jsonError(500, "마음에 들어요 취소에 실패했습니다.");
	}
}
