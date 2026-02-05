import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";
import { normalizeGeneralData } from "@/app/api/_lib/settings";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	try {
		const db = getDb();
		const generalDocRef = db.collection("settings").doc("general");
		const generalDoc = await generalDocRef.get();

		const payload = generalDoc.exists
			? { general: normalizeGeneralData(generalDoc.data()) }
			: { general: {} };

		const etag = `"${createHash("sha1").update(JSON.stringify(payload)).digest("hex")}"`;
		if (req.headers.get("if-none-match") === etag) {
			return new NextResponse(null, {
				status: 304,
				headers: {
					ETag: etag,
					"Cache-Control":
						"no-cache, must-revalidate",
				},
			});
		}

		return NextResponse.json(payload, {
			headers: {
				ETag: etag,
				"Cache-Control":
					"no-cache, must-revalidate",
			},
		});
	} catch (error) {
		console.error("Error fetching settings:", error);
		return jsonError(500, "Failed to fetch settings.");
	}
}
