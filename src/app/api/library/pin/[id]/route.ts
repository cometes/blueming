import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAdmin } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> }
) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	const { id: documentId } = await params;
	if (!documentId) {
		return jsonError(400, "Document id is required.");
	}

	try {
		const body = await req.json();
		const pinned = typeof body?.pinned === "boolean" ? body.pinned : null;
		if (pinned === null) {
			return jsonError(400, "Pinned flag is required.");
		}

		const db = getDb();
		const docRef = db.collection("library").doc(documentId);
		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(404, "Document not found.");
		}

		await docRef.update({
			pinned,
			pinnedAt: pinned ? admin.firestore.FieldValue.serverTimestamp() : null,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return jsonOk({ id: documentId, pinned });
	} catch (error) {
		console.error("Error updating pinned state:", error);
		return jsonError(500, "Failed to update pinned state.");
	}
}
