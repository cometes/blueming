import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";
import { requireManager } from "@/app/api/_lib/auth";
import { normalizeGeneralData } from "@/app/api/_lib/settings";

export const runtime = "nodejs";

const normalizeSettings = (data: unknown) => {
	if (!data || typeof data !== "object") return data;
	const value = data as Record<string, unknown>;
	return {
		...value,
		general: normalizeGeneralData(value.general),
	};
};

const fetchDocumentWithSubCollections = async (docRef: FirebaseFirestore.DocumentReference) => {
	const docSnapshot = await docRef.get();
	const docData = docSnapshot.exists ? docSnapshot.data() : {};

	const subCollections = await docRef.listCollections();
	const subCollectionPromises = subCollections.map(async (subCollection) => {
		const subCollectionSnapshot = await subCollection.get();
		const subCollectionData = subCollectionSnapshot.docs.reduce(
			(acc, doc) => {
				acc[doc.id] = doc.data();
				return acc;
			},
			{} as Record<string, unknown>
		);
		return { [subCollection.id]: subCollectionData };
	});

	const subCollectionResults = await Promise.all(subCollectionPromises);
	return subCollectionResults.reduce(
		(acc, curr) => ({ ...acc, ...curr }),
		docData ?? {}
	);
};

export async function GET(req: NextRequest) {
	try {
		const db = getDb();
		const settingsSnapshot = await db.collection("settings").get();

		const settingsDataPromises = settingsSnapshot.docs.map(async (doc) => {
			const fullData = await fetchDocumentWithSubCollections(doc.ref);
			return { [doc.id]: fullData };
		});

		const settingsData = await Promise.all(settingsDataPromises);
		const result = settingsData.reduce(
			(acc, curr) => ({ ...acc, ...curr }),
			{} as Record<string, unknown>
		);

		const payload = normalizeSettings(result);
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

		return NextResponse.json({ message: "Gallery settings updated" });
	} catch (error) {
		console.error("Error updating gallery settings:", error);
		return jsonError(500, "Failed to update gallery settings.");
	}
}
