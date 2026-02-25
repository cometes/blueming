import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";
import { requireManager } from "@/app/api/_lib/auth";
import { mapEffectTypeToKorean, normalizeGeneralData } from "@/app/api/_lib/settings";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	const auth = await requireManager();
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

		const effectPayload = {
			...payload,
			type: mapEffectTypeToKorean(payload.type),
		};

		await generalDocRef.set(
			{
				effect: effectPayload,
				design: {
					effect: effectPayload,
				},
			},
			{ merge: true }
		);

		const updatedGeneralDoc = await generalDocRef.get();
		const generalData = updatedGeneralDoc.data();
		const normalized = normalizeGeneralData(generalData);

		return NextResponse.json({ general: normalized });
	} catch (error) {
		console.error("Error updating effect:", error);
		return jsonError(500, "Failed to update effect");
	}
}
