import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import {
	COLLECTION_NAME,
	extractTags,
	formatTimestamp,
	normalizeCaption,
	normalizeTags,
	toPhotoBoardAuthor,
} from "@/app/api/_lib/photoboard";

export const runtime = "nodejs";

const toPhotoBoardPostFromDoc = (doc: FirebaseFirestore.DocumentSnapshot) => {
	const data = (doc.data() || {}) as Record<string, unknown>;
	return {
		id: doc.id,
		author: toPhotoBoardAuthor(data),
		createdAt: formatTimestamp(data.createdAt),
		imageUrl: (data.imageUrl as string) || "",
		caption: (data.caption as string) || "",
		likeCount: Number(data.likeCount || 0),
		tags: Array.isArray(data.tags) ? data.tags : [],
	};
};

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> }
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	const { id } = await params;
	if (!id) {
		return jsonError(400, "게시글 ID가 필요합니다.");
	}

	try {
		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "게시글을 찾을 수 없습니다.");
		}

		const data = (snapshot.data() || {}) as Record<string, unknown>;
		const authorId =
			(typeof data.authorId === "string" ? data.authorId : null) ||
			(typeof (data.author as { id?: string } | undefined)?.id === "string"
				? (data.author as { id?: string }).id
				: null);

		if (auth.auth.uid !== authorId && !auth.auth.isAdmin) {
			return jsonError(403, "수정 권한이 없습니다.");
		}

		const body = await req.json();
		const updates: Record<string, unknown> = {};
		if (body?.caption !== undefined) {
			const caption = normalizeCaption(body.caption);
			if (!caption) {
				return jsonError(400, "본문을 입력해주세요.");
			}
			updates.caption = caption;
			const tags = normalizeTags(body?.tags);
			updates.tags = tags.length > 0 ? tags : extractTags(caption);
		} else if (body?.tags !== undefined) {
			updates.tags = normalizeTags(body?.tags);
		}

		if (body?.imageUrl !== undefined) {
			const imageUrl =
				typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
			if (!imageUrl) {
				return jsonError(400, "이미지를 입력해주세요.");
			}
			updates.imageUrl = imageUrl;
		}

		if (Object.keys(updates).length === 0) {
			return jsonError(400, "변경할 내용이 없습니다.");
		}

		updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
		await docRef.set(updates, { merge: true });

		const updatedSnapshot = await docRef.get();
		return jsonOk(toPhotoBoardPostFromDoc(updatedSnapshot));
	} catch (error) {
		console.error("Photoboard update error:", error);
		return jsonError(500, "포토보드 수정에 실패했습니다.");
	}
}

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> }
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	const { id } = await params;
	if (!id) {
		return jsonError(400, "게시글 ID가 필요합니다.");
	}

	try {
		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "게시글을 찾을 수 없습니다.");
		}

		const data = (snapshot.data() || {}) as Record<string, unknown>;
		const authorId =
			(typeof data.authorId === "string" ? data.authorId : null) ||
			(typeof (data.author as { id?: string } | undefined)?.id === "string"
				? (data.author as { id?: string }).id
				: null);

		if (auth.auth.uid !== authorId && !auth.auth.isAdmin) {
			return jsonError(403, "삭제 권한이 없습니다.");
		}

		await docRef.delete();
		return jsonOk({ id });
	} catch (error) {
		console.error("Photoboard delete error:", error);
		return jsonError(500, "포토보드 삭제에 실패했습니다.");
	}
}
