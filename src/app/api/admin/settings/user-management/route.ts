import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireManager } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

export async function GET() {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const db = getDb();
		const docRef = db.collection("siteSettings").doc("userManagement");
		const snapshot = await docRef.get();
		const data = snapshot.exists ? snapshot.data() || {} : {};

		const payload = {
			registrationMode: data.registrationMode ?? "open",
			whitelist: Array.isArray(data.whitelist) ? data.whitelist : [],
			blacklist: Array.isArray(data.blacklist) ? data.blacklist : [],
			autoApprove: data.autoApprove === true,
			notifyOnNewUser: data.notifyOnNewUser !== false,
			updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
			updatedBy: data.updatedBy ?? "",
		};

		return jsonOk(payload);
	} catch (error) {
		console.error("Error fetching user management settings:", error);
		return jsonError(500, "Failed to fetch settings.");
	}
}

export async function PUT(req: NextRequest) {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const body = await req.json();
		const {
			registrationMode,
			whitelist,
			blacklist,
			autoApprove,
			notifyOnNewUser,
		} = body ?? {};

		if (!["open", "approval", "closed"].includes(String(registrationMode || ""))) {
			return jsonError(400, "Invalid registration mode.");
		}

		const normalizeList = (value: unknown) =>
			Array.isArray(value)
				? value.filter((item) => typeof item === "string" && item.trim() !== "")
				: [];

		const db = getDb();
		await db.collection("siteSettings").doc("userManagement").set(
			{
				registrationMode,
				whitelist: normalizeList(whitelist),
				blacklist: normalizeList(blacklist),
				autoApprove: autoApprove === true,
				notifyOnNewUser: notifyOnNewUser !== false,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedBy: auth.auth.uid ?? "",
			},
			{ merge: true }
		);

		return jsonOk({ ok: true });
	} catch (error) {
		console.error("Error updating user management settings:", error);
		return jsonError(500, "Failed to update settings.");
	}
}
