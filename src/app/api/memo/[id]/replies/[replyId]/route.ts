import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import {
	COLLECTION_NAME,
	REPLY_COLLECTION,
	normalizeContent,
	normalizeImageUrls,
} from "@/app/api/_lib/memo";

export const runtime = "nodejs";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; replyId: string }> }
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { id, replyId } = await params;
		if (!id || !replyId) {
			return jsonError(400, "메모 ID가 필요합니다.");
		}

		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const replyRef = docRef.collection(REPLY_COLLECTION).doc(replyId);
		const replySnapshot = await replyRef.get();
		if (!replySnapshot.exists) {
			return jsonError(404, "답글을 찾을 수 없습니다.");
		}

		const replyData = (replySnapshot.data() || {}) as Record<string, unknown>;
		const replyAuthorId =
			typeof (replyData.author as { id?: string } | undefined)?.id === "string"
				? (replyData.author as { id?: string }).id
				: null;
		if (!replyAuthorId || auth.auth.uid !== replyAuthorId) {
			return jsonError(403, "작성자만 수정할 수 있습니다.");
		}

		const body = await req.json();
		const content = normalizeContent(body?.content);
		if (!content) {
			return jsonError(400, "내용을 입력해주세요.");
		}
		const imageUrls = normalizeImageUrls(body?.imageUrls);

		await replyRef.update({
			content,
			imageUrls,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
		const updatedSnapshot = await replyRef.get();
		return jsonOk({ id: updatedSnapshot.id, ...updatedSnapshot.data() });
	} catch (error) {
		console.error("Memo reply update error:", error);
		return jsonError(500, "답글 수정에 실패했습니다.");
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; replyId: string }> }
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { id, replyId } = await params;
		if (!id || !replyId) {
			return jsonError(400, "메모 ID가 필요합니다.");
		}

		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const replyRef = docRef.collection(REPLY_COLLECTION).doc(replyId);
		const replySnapshot = await replyRef.get();
		if (!replySnapshot.exists) {
			return jsonError(404, "답글을 찾을 수 없습니다.");
		}

		const replyData = (replySnapshot.data() || {}) as Record<string, unknown>;
		const replyAuthorId =
			typeof (replyData.author as { id?: string } | undefined)?.id === "string"
				? (replyData.author as { id?: string }).id
				: null;
		if (!replyAuthorId || auth.auth.uid !== replyAuthorId) {
			return jsonError(403, "작성자만 삭제할 수 있습니다.");
		}

		await replyRef.delete();
		await docRef.update({
			replyCount: admin.firestore.FieldValue.increment(-1),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
		return jsonOk({ success: true });
	} catch (error) {
		console.error("Memo reply delete error:", error);
		return jsonError(500, "답글 삭제에 실패했습니다.");
	}
}
