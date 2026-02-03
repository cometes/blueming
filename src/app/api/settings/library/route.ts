import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";
import { requireAdmin } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

const respondWithCache = (req: NextRequest, body: unknown) => {
	const payload = JSON.stringify(body);
	const etag = `"${createHash("sha1").update(payload).digest("hex")}"`;
	const headers = {
		"Cache-Control":
			"public, max-age=60, s-maxage=300, stale-while-revalidate=600",
		ETag: etag,
	};

	if (req.headers.get("if-none-match") === etag) {
		return new NextResponse(null, { status: 304, headers });
	}

	return NextResponse.json(body, { headers });
};

const pickLibraryPayload = (payload: unknown) => {
	if (!payload || typeof payload !== "object") return null;
	const data = payload as Record<string, unknown>;

	const nextPayload: Record<string, unknown> = {};

	if (typeof data.layoutType === "string") {
		nextPayload.layoutType = data.layoutType;
	}
	if (typeof data.postsPerPage === "number") {
		nextPayload.postsPerPage = data.postsPerPage;
	}
	if (typeof data.postsPerRow === "number") {
		nextPayload.postsPerRow = data.postsPerRow;
	}
	if (typeof data.writePermission === "string") {
		if (["admin", "manager", "member"].includes(data.writePermission)) {
			nextPayload.writePermission = data.writePermission;
		}
	}

	return nextPayload;
};

export async function GET(req: NextRequest) {
	try {
		const db = getDb();
		const docRef = db.collection("settings").doc("library");
		const snapshot = await docRef.get();
		const library = snapshot.exists ? snapshot.data() ?? {} : {};

		return respondWithCache(req, { library });
	} catch (error) {
		console.error("Error fetching library settings:", error);
		return jsonError(500, "Failed to fetch library settings.");
	}
}

export async function POST(req: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const body = await req.json();
		const payload = pickLibraryPayload(body);
		if (!payload) {
			return jsonError(400, "Invalid data structure in request body");
		}

		const db = getDb();
		const docRef = db.collection("settings").doc("library");
		await docRef.set(payload, { merge: true });

		const updated = await docRef.get();
		return NextResponse.json({ library: updated.data() ?? {} });
	} catch (error) {
		console.error("Error updating library settings:", error);
		return jsonError(500, "Failed to update library settings");
	}
}
