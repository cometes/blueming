import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";
import { requireManager } from "@/app/api/_lib/auth";
import { normalizeGeneralData } from "@/app/api/_lib/settings";

export const runtime = "nodejs";

export async function GET() {
	try {
		const db = getDb();
		const generalDocRef = db.collection("settings").doc("general");
		const generalDocSnapshot = await generalDocRef.get();
		if (!generalDocSnapshot.exists) {
			return NextResponse.json([]);
		}

		const generalData = generalDocSnapshot.data() || {};
		const theme = generalData.theme;
		if (Array.isArray(theme)) {
			return NextResponse.json(theme);
		}
		if (theme && typeof theme === "object" && Array.isArray(theme.value)) {
			return NextResponse.json(theme.value);
		}
		return NextResponse.json([]);
	} catch (error) {
		console.error("Error fetching theme:", error);
		return jsonError(500, "Failed to fetch theme");
	}
}

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

		await generalDocRef.set({ theme: payload }, { merge: true });
		revalidateTag("settings");

		const updatedGeneralDoc = await generalDocRef.get();
		const generalData = updatedGeneralDoc.data();
		const normalized = normalizeGeneralData(generalData);

		return NextResponse.json({ general: normalized });
	} catch (error) {
		console.error("Error updating theme:", error);
		return jsonError(500, "Failed to update theme");
	}
}
