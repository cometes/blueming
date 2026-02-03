import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAdmin, requireManager } from "@/app/api/_lib/auth";
import { getUserDoc } from "@/app/api/_lib/adminUsers";

export const runtime = "nodejs";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ uid: string }> }
) {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { uid } = await params;
		const db = getDb();
		const user = await getUserDoc(db, uid);
		if (!user) {
			return jsonError(404, "User not found.");
		}
		return jsonOk(user);
	} catch (error) {
		console.error("Error fetching user detail:", error);
		return jsonError(500, "Failed to fetch user detail.");
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ uid: string }> }
) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { uid } = await params;
		if (auth.auth.uid === uid) {
			return jsonError(400, "Cannot delete own account.");
		}
		const db = getDb();
		await admin.auth().deleteUser(uid);
		await db.collection("users").doc(uid).delete();
		return jsonOk({ uid });
	} catch (error) {
		console.error("Error deleting user:", error);
		return jsonError(500, "Failed to delete user.");
	}
}
