import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";
import { requireManager } from "@/app/api/_lib/auth";
import { getServerSettings } from "@/app/api/_lib/settingsServer";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	try {
		// SSR과 동일한 데이터 캐시(tag: settings)를 공유 — 캐시 히트 시 Firestore 왕복 0회.
		// 신선도는 설정 쓰기 라우트들의 revalidateTag("settings")가 보장한다.
		const payload = await getServerSettings();
		if (!payload) {
			return jsonError(500, "Failed to fetch settings.");
		}

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
		console.error("Error fetching settings and subcollections:", error);
		return jsonError(500, "Failed to fetch settings.");
	}
}

export async function PATCH(req: NextRequest) {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const body = await req.json();
		const gallerySettings = body?.gallery;
		if (!gallerySettings || typeof gallerySettings !== "object") {
			return jsonError(400, "gallery settings object is required");
		}
		const writePermission = (gallerySettings as Record<string, unknown>)
			.writePermission;
		if (
			writePermission !== undefined &&
			writePermission !== "admin" &&
			writePermission !== "manager" &&
			writePermission !== "member"
		) {
			return jsonError(400, "Invalid gallery writePermission");
		}
		const options = (gallerySettings as Record<string, unknown>).options;
		if (options && typeof options === "object") {
			const columns = (options as Record<string, unknown>).columns;
			if (columns !== undefined) {
				const numericColumns = Number(columns);
				if (!Number.isFinite(numericColumns)) {
					return jsonError(400, "Invalid gallery columns");
				}
				(options as Record<string, unknown>).columns = Math.min(
					Math.max(Math.floor(numericColumns), 1),
					5,
				);
			}
		}

		const db = getDb();
		await db.collection("settings").doc("gallery").set(gallerySettings, {
			merge: true,
		});
		revalidateTag("settings");

		return NextResponse.json({ message: "Gallery settings updated" });
	} catch (error) {
		console.error("Error updating gallery settings:", error);
		return jsonError(500, "Failed to update gallery settings.");
	}
}
