import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAdmin, requireAuth } from "@/app/api/_lib/auth";
import { uploadFormDataFiles } from "@/app/api/_lib/upload";

export const runtime = "nodejs";

const ASSETS_COLLECTION = "stickerAssets";

const toAsset = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
	const data = doc.data() as Record<string, unknown>;
	const createdAt = data.createdAt as FirebaseFirestore.Timestamp | undefined;
	const lastUsedAt = data.lastUsedAt as FirebaseFirestore.Timestamp | undefined;
	return {
		id: doc.id,
		url: data.url as string,
		name: data.name as string | undefined,
		width: data.width as number | undefined,
		height: data.height as number | undefined,
		favorite: data.favorite === true,
		storagePath: data.storagePath as string | undefined,
		createdAtMs: createdAt ? createdAt.toMillis() : undefined,
		lastUsedAtMs: lastUsedAt ? lastUsedAt.toMillis() : undefined,
	};
};

export async function GET(req: NextRequest) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const tab = req.nextUrl.searchParams.get("tab") || "all";
		let query: FirebaseFirestore.Query = getDb().collection(ASSETS_COLLECTION);

		if (tab === "favorites") {
			query = query.where("favorite", "==", true).orderBy("createdAt", "desc");
		} else if (tab === "recent") {
			query = query.orderBy("lastUsedAt", "desc");
		} else {
			query = query.orderBy("createdAt", "desc");
		}

		const snapshot = await query.limit(200).get();
		const items = snapshot.docs
			.map(toAsset)
			.filter((item) => typeof item.url === "string" && item.url.length > 0);

		return jsonOk({ items });
	} catch (error) {
		console.error("Failed to list sticker assets:", error);
		return jsonError(500, "스티커 자산을 불러오지 못했습니다.");
	}
}

export async function POST(req: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const formData = await req.formData();
		const files = await uploadFormDataFiles(formData, {
			prefix: "sticker-assets",
		});
		if (files.length === 0) {
			return jsonError(400, "업로드할 파일이 없습니다.");
		}

		const primary = files[0];
		const name = typeof formData.get("name") === "string" ? String(formData.get("name")).trim() : primary.filename;
		const widthValue = typeof formData.get("width") === "string" ? Number(formData.get("width")) : NaN;
		const heightValue = typeof formData.get("height") === "string" ? Number(formData.get("height")) : NaN;

		const db = getDb();
		const docRef = await db.collection(ASSETS_COLLECTION).add({
			url: primary.url,
			name: name || primary.filename,
			width: Number.isFinite(widthValue) ? widthValue : undefined,
			height: Number.isFinite(heightValue) ? heightValue : undefined,
			favorite: false,
			storagePath: primary.storagePath,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return jsonOk({
			id: docRef.id,
			url: primary.url,
			name: name || primary.filename,
			width: Number.isFinite(widthValue) ? widthValue : undefined,
			height: Number.isFinite(heightValue) ? heightValue : undefined,
			favorite: false,
			storagePath: primary.storagePath,
		});
	} catch (error) {
		console.error("Failed to create sticker asset:", error);
		return jsonError(500, "스티커 자산 생성에 실패했습니다.");
	}
}
