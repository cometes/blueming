import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import {
	COLLECTION_NAME,
	formatTimestamp,
	normalizeCategory,
	normalizeDescription,
	normalizeTags,
	normalizeTitle,
	toGalleryAuthor,
} from "@/app/api/_lib/gallery";

export const runtime = "nodejs";

const toGalleryItemFromDoc = (doc: FirebaseFirestore.DocumentSnapshot) => {
	const data = (doc.data() || {}) as Record<string, unknown>;
	return {
		id: doc.id,
		src: (data.imageUrl as string) || (data.src as string) || "",
		title: (data.title as string) || "",
		category: (data.category as string) || "Gallery",
		description: (data.description as string) || "",
		tags: Array.isArray(data.tags) ? data.tags : [],
		width: (data.width as number | undefined) ?? undefined,
		height: (data.height as number | undefined) ?? undefined,
		createdAt: formatTimestamp(data.createdAt),
		author: data.author ?? null,
	};
};

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> }
) {
	try {
		const { id } = await params;
		if (!id) {
			return jsonError(400, "이미지 ID가 필요합니다.");
		}
		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "이미지를 찾을 수 없습니다.");
		}
		return jsonOk(toGalleryItemFromDoc(snapshot));
	} catch (error) {
		console.error("Gallery detail error:", error);
		return jsonError(500, "이미지를 불러오지 못했습니다.");
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> }
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { id } = await params;
		if (!id) {
			return jsonError(400, "이미지 ID가 필요합니다.");
		}

		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "이미지를 찾을 수 없습니다.");
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
		if (body?.title !== undefined) {
			const title = normalizeTitle(body.title);
			if (!title) {
				return jsonError(400, "제목을 입력해주세요.");
			}
			updates.title = title;
		}
		if (body?.imageUrl !== undefined || body?.src !== undefined) {
			const imageUrl =
				typeof body?.imageUrl === "string"
					? body.imageUrl.trim()
					: typeof body?.src === "string"
						? body.src.trim()
						: "";
			if (!imageUrl) {
				return jsonError(400, "이미지를 입력해주세요.");
			}
			updates.imageUrl = imageUrl;
		}
		if (body?.tags !== undefined) {
			updates.tags = normalizeTags(body?.tags);
		}
		if (body?.category !== undefined) {
			updates.category = normalizeCategory(body?.category) || "Gallery";
		}
		if (body?.description !== undefined) {
			updates.description = normalizeDescription(body?.description);
		}

		if (Object.keys(updates).length === 0) {
			return jsonError(400, "변경할 내용이 없습니다.");
		}

		updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
		await docRef.update(updates);

		const updatedSnapshot = await docRef.get();
		const updatedData = (updatedSnapshot.data() || {}) as Record<string, unknown>;
		return jsonOk({
			id: updatedSnapshot.id,
			src: (updatedData.imageUrl as string) || (updatedData.src as string) || "",
			title: (updatedData.title as string) || "",
			category: (updatedData.category as string) || "Gallery",
			description: (updatedData.description as string) || "",
			tags: Array.isArray(updatedData.tags) ? updatedData.tags : [],
			width: (updatedData.width as number | undefined) ?? undefined,
			height: (updatedData.height as number | undefined) ?? undefined,
			createdAt: formatTimestamp(updatedData.createdAt),
			author: toGalleryAuthor(updatedData),
		});
	} catch (error) {
		console.error("Gallery update error:", error);
		return jsonError(500, "갤러리 수정에 실패했습니다.");
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

	try {
		const { id } = await params;
		if (!id) {
			return jsonError(400, "이미지 ID가 필요합니다.");
		}

		const db = getDb();
		const docRef = db.collection(COLLECTION_NAME).doc(id);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "이미지를 찾을 수 없습니다.");
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
		console.error("Gallery delete error:", error);
		return jsonError(500, "갤러리 삭제에 실패했습니다.");
	}
}
