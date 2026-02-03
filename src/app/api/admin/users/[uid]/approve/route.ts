import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireManager } from "@/app/api/_lib/auth";
import { getUserDoc, isHigherRole } from "@/app/api/_lib/adminUsers";

export const runtime = "nodejs";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ uid: string }> }
) {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { uid } = await params;
		const body = await req.json();
		const { approved, reason } = body ?? {};

		if (typeof approved !== "boolean") {
			return jsonError(400, "Invalid approval payload.");
		}

		const db = getDb();
		const targetUser = await getUserDoc(db, uid);
		if (!targetUser) {
			return jsonError(404, "User not found.");
		}

		if (isHigherRole(targetUser.role, auth.auth)) {
			return jsonError(403, "Cannot modify admin user.");
		}

		await db.collection("users").doc(uid).update({
			status: approved ? "active" : "suspended",
			approvedAt: approved ? admin.firestore.FieldValue.serverTimestamp() : null,
			approvedBy: approved ? auth.auth.uid ?? null : null,
			suspendedReason: approved ? null : reason ?? null,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return jsonOk({ uid });
	} catch (error) {
		console.error("Error approving user:", error);
		return jsonError(500, "Failed to approve user.");
	}
}
