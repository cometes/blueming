import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb, getBucket } from "@/app/api/_lib/admin";
import { requireAdmin } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ assetId: string }> }
) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { assetId } = await params;
		const db = getDb();
		const docRef = db.collection("stickerAssets").doc(assetId);
		const snapshot = await docRef.get();
		const data = snapshot.data() as { storagePath?: string } | undefined;
		if (data?.storagePath) {
			try {
				await getBucket().file(data.storagePath).delete({ ignoreNotFound: true });
			} catch (error) {
				console.warn("Failed to delete storage object:", error);
			}
		}
		await docRef.delete();
		return jsonOk({ ok: true });
	} catch (error) {
		console.error("Failed to delete sticker asset:", error);
		return jsonError(500, "스티커 자산 삭제에 실패했습니다.");
	}
}
