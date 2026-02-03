import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";
import { requireAdmin } from "@/app/api/_lib/auth";
import { mapMenuDesignToKorean, normalizeGeneralData } from "@/app/api/_lib/settings";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const db = getDb();
		const generalDocRef = db.collection("settings").doc("general");
		const generalDocSnapshot = await generalDocRef.get();
		if (!generalDocSnapshot.exists) {
			await generalDocRef.set({});
		}

		const payload = await req.json();
		if (!payload || typeof payload !== "object") {
			return jsonError(400, "Invalid data structure in request body");
		}

		const menuPayload = {
			...payload,
			design: mapMenuDesignToKorean(payload.design),
		};

		await generalDocRef.set({ menu: menuPayload }, { merge: true });

		const updatedGeneralDoc = await generalDocRef.get();
		const generalData = updatedGeneralDoc.data();
		const normalized = normalizeGeneralData(generalData);

		return NextResponse.json({ general: normalized });
	} catch (error) {
		console.error("Error updating menu:", error);
		return jsonError(500, "Failed to update menu");
	}
}
