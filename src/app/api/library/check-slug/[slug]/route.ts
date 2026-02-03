import type { NextRequest } from "next/server";
import { jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { normalizeSlug } from "@/app/api/_lib/library";

export const runtime = "nodejs";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ slug?: string }> }
) {
	const { slug } = await params;
	const rawSlug = slug ?? "";
	const normalizedSlug = normalizeSlug(rawSlug);
	if (!normalizedSlug) {
		return jsonOk({ available: true });
	}

	const db = getDb();
	const snapshot = await db
		.collection("library")
		.where("slug", "==", normalizedSlug)
		.limit(1)
		.get();

	return jsonOk({ available: snapshot.empty });
}
