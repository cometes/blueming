import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { getAuthContext, requireAuth } from "@/app/api/_lib/auth";
import {
	COLLECTION_NAME,
	REPLY_COLLECTION,
	formatTimestamp,
	normalizeContent,
	normalizeImageUrls,
	normalizeTags,
	normalizeTitle,
	normalizeVisibility,
	toMemoItemFromDoc,
	toMemoReply,
	deleteCollectionInBatches,
} from "@/app/api/_lib/memo";

export const runtime = "nodejs";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		if (!id) {
			return jsonError(400, "메모 ID가 필요합니다.");
		}

		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "메모를 찾을 수 없습니다.");
		}

		const data = (snapshot.data() || {}) as Record<string, unknown>;
		const visibility = (data.visibility as string) || "public";
		const authContext = await getAuthContext();
		const authorId = typeof data.authorId === "string" ? data.authorId : null;
		const isOwner = Boolean(authorId) && authContext?.uid === authorId;
		const isAdmin = Boolean(authContext?.isAdmin);
		const canBypass = isOwner || isAdmin;

		const headerPassword = req.headers.get("x-memo-password") || "";
		const queryPassword = req.nextUrl.searchParams.get("password") || "";
		const providedPassword = headerPassword || queryPassword;

		if (visibility === "protected" && !canBypass && !providedPassword) {
			return jsonOk({
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
			});
		}

		if (
			visibility === "protected" &&
			!canBypass &&
			providedPassword !== (data.password as string | undefined)
		) {
			return jsonError(403, "Invalid password.", { requiresPassword: true });
		}

		if (visibility === "secret" && !canBypass) {
			return jsonOk({
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
			});
		}

		const repliesSnapshot = await docRef
			.collection(REPLY_COLLECTION)
			.orderBy("createdAt", "asc")
			.get();
		const replies = repliesSnapshot.docs.map(toMemoReply);

		return jsonOk({
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
		});
	} catch (error) {
		console.error("Memo detail error:", error);
		return jsonError(500, "메모를 불러오지 못했습니다.");
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { id } = await params;
		if (!id) {
			return jsonError(400, "메모 ID가 필요합니다.");
		}
		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "메모를 찾을 수 없습니다.");
		}

		const data = (snapshot.data() || {}) as Record<string, unknown>;
		const authorId = typeof data.authorId === "string" ? data.authorId : null;
		if (!authorId || (auth.auth.uid !== authorId && !auth.auth.isAdmin)) {
			return jsonError(403, "작성자만 수정할 수 있습니다.");
		}

		const body = await req.json();
		const title = normalizeTitle(body?.title) || "제목 없음";
		const content = normalizeContent(body?.content);
		if (!content) {
			return jsonError(400, "내용을 입력해주세요.");
		}
		const tags = normalizeTags(body?.tags);
		const visibility = normalizeVisibility(body?.visibility);
		const imageUrls = normalizeImageUrls(body?.imageUrls);

		let password = "";
		if (visibility === "protected") {
			const inputPassword =
				typeof body?.password === "string" ? body.password.trim() : "";
			const existingPassword =
				typeof data.password === "string" ? data.password : "";
			password = inputPassword || existingPassword;
			if (!password) {
				return jsonError(400, "보호글 비밀번호가 필요합니다.");
			}
		}

		const updatePayload: Record<string, unknown> = {
			title,
			content,
			visibility,
			tags,
			imageUrls,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		updatePayload.password = visibility === "protected" ? password : null;

		await docRef.update(updatePayload);
		const updatedSnapshot = await docRef.get();
		return jsonOk(toMemoItemFromDoc(updatedSnapshot));
	} catch (error) {
		console.error("Memo update error:", error);
		return jsonError(500, "메모 수정에 실패했습니다.");
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { id } = await params;
		if (!id) {
			return jsonError(400, "메모 ID가 필요합니다.");
		}
		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "메모를 찾을 수 없습니다.");
		}

		const data = (snapshot.data() || {}) as Record<string, unknown>;
		const authorId = typeof data.authorId === "string" ? data.authorId : null;
		if (!authorId || (auth.auth.uid !== authorId && !auth.auth.isAdmin)) {
			return jsonError(403, "작성자만 삭제할 수 있습니다.");
		}

		await deleteCollectionInBatches(docRef.collection(REPLY_COLLECTION));
		await docRef.delete();
		return jsonOk({ success: true });
	} catch (error) {
		console.error("Memo delete error:", error);
		return jsonError(500, "메모 삭제에 실패했습니다.");
	}
}
