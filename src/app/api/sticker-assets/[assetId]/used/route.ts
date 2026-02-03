import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ assetId: string }> }
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { assetId } = await params;
		await getDb().collection("stickerAssets").doc(assetId).set(
			{
				lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true }
		);
		return jsonOk({ ok: true });
	} catch (error) {
		console.error("Failed to update lastUsedAt:", error);
		return jsonError(500, "사용 시간 업데이트에 실패했습니다.");
	}
}
