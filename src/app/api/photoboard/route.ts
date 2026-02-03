import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import {
	COLLECTION_NAME,
	MAX_LIMIT,
	extractTags,
	formatTimestamp,
	normalizeCaption,
	normalizeTags,
	parsePositiveInt,
	toPhotoBoardAuthor,
} from "@/app/api/_lib/photoboard";

export const runtime = "nodejs";

const toPhotoBoardPost = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
	const data = doc.data() as Record<string, unknown>;
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

export async function GET(req: NextRequest) {
	try {
		const db = getDb();
		const limit = Math.min(
			parsePositiveInt(req.nextUrl.searchParams.get("limit"), 18),
			MAX_LIMIT
		);
		const snapshot = await db
			.collection(COLLECTION_NAME)
			.orderBy("createdAt", "desc")
			.limit(limit)
			.get();
		const items = snapshot.docs.map(toPhotoBoardPost);
		return jsonOk({ items });
	} catch (error) {
		console.error("Photoboard list error:", error);
		return jsonError(500, "포토보드 데이터를 불러오지 못했습니다.");
	}
}

export async function POST(req: NextRequest) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const db = getDb();
		const body = await req.json();
		const caption = normalizeCaption(body?.caption);
		const imageUrl =
			typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
		const tagsInput = normalizeTags(body?.tags);
		const tags = tagsInput.length > 0 ? tagsInput : extractTags(caption);

		if (!caption || !imageUrl) {
			return jsonError(400, "이미지와 본문을 입력해주세요.");
		}

		const authorName = auth.auth.displayName || "게스트";
		const authorAvatar = auth.auth.photoURL || "";

		const docRef = await db.collection(COLLECTION_NAME).add({
			authorId: auth.auth.uid,
			author: {
				id: auth.auth.uid,
				name: authorName,
				avatarUrl: authorAvatar,
			},
			imageUrl,
			caption,
			likeCount: 0,
			tags,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		const snapshot = await docRef.get();
		const data = snapshot.data() as Record<string, unknown> | undefined;
		if (!data) {
			return jsonError(500, "포토보드 저장에 실패했습니다.");
		}

		return jsonOk(
			{
				id: snapshot.id,
				author: toPhotoBoardAuthor(data),
				createdAt: formatTimestamp(data.createdAt),
				imageUrl: (data.imageUrl as string) || "",
				caption: (data.caption as string) || "",
				likeCount: Number(data.likeCount || 0),
				tags: Array.isArray(data.tags) ? data.tags : [],
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Photoboard create error:", error);
		return jsonError(500, "포토보드 저장에 실패했습니다.");
	}
}
