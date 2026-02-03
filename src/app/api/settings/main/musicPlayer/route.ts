import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";
import { requireAdmin } from "@/app/api/_lib/auth";
import { validateMusicPlayerSettings } from "@/app/api/_lib/settingsMain";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const db = getDb();
		const mainDocRef = db.collection("settings").doc("main");
		const mainDocSnapshot = await mainDocRef.get();
		if (!mainDocSnapshot.exists) {
			await mainDocRef.set({});
		}

		const body = await req.json();
		const nextValue = validateMusicPlayerSettings(body?.value);
		if (!nextValue) {
			return jsonError(400, "Invalid data structure in request body");
		}

		await mainDocRef.set({ musicPlayer: nextValue }, { merge: true });
		const updatedMainDoc = await mainDocRef.get();
		return NextResponse.json({ main: updatedMainDoc.data() });
	} catch (error) {
		console.error("Error updating musicPlayer:", error);
		return jsonError(500, "Failed to update musicPlayer");
	}
}
