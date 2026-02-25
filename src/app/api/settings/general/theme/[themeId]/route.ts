import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";
import { requireManager } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ themeId?: string }> }
) {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { themeId } = await params;
		if (!themeId) {
			return jsonError(400, "themeId is required");
		}

		const db = getDb();
		const generalDocRef = db.collection("settings").doc("general");
		const generalDocSnapshot = await generalDocRef.get();
		if (!generalDocSnapshot.exists) {
			return jsonError(404, "Theme not found");
		}

		const generalData = generalDocSnapshot.data() || {};
		const themeValue = Array.isArray(generalData.theme)
			? generalData.theme
			: generalData.theme?.value;
		const themes = Array.isArray(themeValue) ? (themeValue as Array<{ id?: string }>) : [];
		const updatedThemes = themes.filter((theme) => theme?.id !== themeId);

		await generalDocRef.set({ theme: updatedThemes }, { merge: true });

		return NextResponse.json({ success: true, themes: updatedThemes });
	} catch (error) {
		console.error("Error deleting theme:", error);
		return jsonError(500, "Failed to delete theme");
	}
}
