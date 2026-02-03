import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireManager } from "@/app/api/_lib/auth";
import { getUserDoc, isHigherRole } from "@/app/api/_lib/adminUsers";

export const runtime = "nodejs";

export async function PATCH(
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
		const { status, reason } = body ?? {};

		if (!status || !["active", "suspended", "pending"].includes(status)) {
			return jsonError(400, "Invalid status.");
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
			status,
			suspendedReason: status === "suspended" ? reason ?? null : null,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return jsonOk({ uid });
	} catch (error) {
		console.error("Error updating user status:", error);
		return jsonError(500, "Failed to update user status.");
	}
}
