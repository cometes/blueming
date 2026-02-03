import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAdmin } from "@/app/api/_lib/auth";
import {
	getCustomClaimsForRole,
	getUserDoc,
} from "@/app/api/_lib/adminUsers";

export const runtime = "nodejs";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ uid: string }> }
) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { uid } = await params;
		const body = await req.json();
		const { role } = body ?? {};

		if (!role || !["user", "manager", "admin"].includes(role)) {
			return jsonError(400, "Invalid role.");
		}

		if (auth.auth.uid === uid) {
			return jsonError(400, "Cannot change own role.");
		}

		const db = getDb();
		const targetUser = await getUserDoc(db, uid);
		if (!targetUser) {
			return jsonError(404, "User not found.");
		}

		const userRecord = await admin.auth().getUser(uid);
		const existingClaims = userRecord.customClaims || {};
		const nextClaims = {
			...existingClaims,
			...getCustomClaimsForRole(role),
		};

		await admin.auth().setCustomUserClaims(uid, nextClaims);
		await db.collection("users").doc(uid).update({
			role,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return jsonOk({ uid });
	} catch (error) {
		console.error("Error updating user role:", error);
		return jsonError(500, "Failed to update user role.");
	}
}
