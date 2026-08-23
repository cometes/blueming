import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import { buildRateLimitKey, checkRateLimit } from "@/app/api/_lib/rateLimit";
import {
	COLLECTION_NAME,
	REPLY_COLLECTION,
	normalizeContent,
	normalizeImageUrls,
} from "@/app/api/_lib/memo";

import {
	actorFromAuth,
	emitNotification,
	getAdminRecipientUids,
} from "@/app/api/_lib/notifications";

export const runtime = "nodejs";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	if (!auth.auth.isAdmin) {
		const key = buildRateLimitKey(auth.auth, req, "memo_reply");
		const rateLimit = await checkRateLimit(key, {
			collection: "memoReplyRateLimits",
			cooldownMs: 5_000,
			minuteLimit: 10,
			hourLimit: 50,
		});
		if (rateLimit.ok === false) {
			const retryAfter = Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000));
			const message = rateLimit.reason === "cooldown"
				? `잠시 후 다시 시도해주세요. (${retryAfter}초)`
				: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.";
			return jsonError(429, message, { retryAfter });
		}
	}

	try {
		const { id } = await params;
		if (!id) {
			return jsonError(400, "메모 ID가 필요합니다.");
		}

		const body = await req.json();
		const content = normalizeContent(body?.content);
		if (!content) {
			return jsonError(400, "내용을 입력해주세요.");
		}
		const imageUrls = normalizeImageUrls(body?.imageUrls);

		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "메모를 찾을 수 없습니다.");
		}
		const data = (snapshot.data() || {}) as Record<string, unknown>;
		const authorId = typeof data.authorId === "string" ? data.authorId : null;
		if (!authorId || auth.auth.uid !== authorId) {
			return jsonError(403, "작성자만 답글을 작성할 수 있습니다.");
		}

		const authorName = auth.auth.displayName || "게스트";
		const authorAvatar = auth.auth.photoURL || "";

		const replyRef = await docRef.collection(REPLY_COLLECTION).add({
			content,
			imageUrls,
			author: {
				id: auth.auth.uid,
				name: authorName,
				avatarUrl: authorAvatar,
			},
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		await docRef.update({
			replyCount: admin.firestore.FieldValue.increment(1),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			lastReplyAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		try {
			const memoTitle = typeof data.title === "string" ? data.title : "";
			await emitNotification({
				actor: actorFromAuth(auth.auth),
				recipients: [...(await getAdminRecipientUids()), authorId],
				type: "memoReply",
				category: "comment",
				message: `${authorName}님이 ${memoTitle ? `"${memoTitle}"에 ` : ""}답글을 남겼습니다`,
				excerpt: content,
				link: `/memo/${id}`,
			});
		} catch (notifyError) {
			console.error("Error emitting memo reply notification:", notifyError);
		}

		const replySnapshot = await replyRef.get();
		return jsonOk({ id: replySnapshot.id, ...replySnapshot.data() }, { status: 201 });
	} catch (error) {
		console.error("Memo reply error:", error);
		return jsonError(500, "답글을 저장하지 못했습니다.");
	}
}
