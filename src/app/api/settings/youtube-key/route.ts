import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { requireAdmin } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

// YouTube Data API v3 키 (재생목록 임포트용) — weather-key 라우트와 동일 패턴

const maskApiKey = (value: string) => {
	const trimmed = value.trim();
	if (trimmed.length <= 8) return "********";
	return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
};

const getDocRef = (db: FirebaseFirestore.Firestore, uid: string) =>
	db.collection("userSecrets").doc(uid).collection("youtube").doc("dataApi");

export async function GET() {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const db = getDb();
		const snapshot = await getDocRef(db, auth.auth.uid).get();
		if (!snapshot.exists) {
			return jsonOk({ hasKey: false });
		}

		const data = snapshot.data() ?? {};
		return jsonOk({
			hasKey: true,
			keyHint: (data as { keyHint?: string }).keyHint ?? null,
			updatedAt:
				(data as { updatedAt?: FirebaseFirestore.Timestamp }).updatedAt
					?.toDate?.()
					?.toISOString?.() ?? null,
		});
	} catch (error) {
		console.error("Error fetching YouTube API key:", error);
		return jsonError(500, "Failed to fetch API key.");
	}
}

export async function POST(req: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const body = await req.json();
		const apiKey = typeof body?.apiKey === "string" ? body.apiKey : "";
		if (!apiKey.trim()) {
			return jsonError(400, "API key is required.");
		}

		const db = getDb();
		const docRef = getDocRef(db, auth.auth.uid);
		const snapshot = await docRef.get();
		const payload = {
			apiKey: apiKey.trim(),
			keyHint: maskApiKey(apiKey),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			...(snapshot.exists
				? {}
				: { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
		};

		await docRef.set(payload, { merge: true });
		return jsonOk({ success: true, keyHint: payload.keyHint });
	} catch (error) {
		console.error("Error saving YouTube API key:", error);
		return jsonError(500, "Failed to save API key.");
	}
}

export async function DELETE() {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const db = getDb();
		await getDocRef(db, auth.auth.uid).delete();
		return jsonOk({ success: true });
	} catch (error) {
		console.error("Error deleting YouTube API key:", error);
		return jsonError(500, "Failed to delete API key.");
	}
}
