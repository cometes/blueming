import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { getAuthContext } from "@/app/api/_lib/auth";
import {
	PIN_REGEX,
	normalizeBoolean,
	normalizeImageUrls,
	normalizeMessage,
	verifyPin,
} from "@/app/api/_lib/guestbook";

export const runtime = "nodejs";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> }
) {
	const { id } = await params;
	if (!id) {
		return jsonError(400, "Entry id is required.");
	}

	try {
		const db = getDb();
		const authContext = await getAuthContext();
		const docRef = db.collection("guestbook").doc(id);
		const snapshot = await docRef.get();

		if (!snapshot.exists) {
			return jsonError(404, "Entry not found.");
		}

		const data = snapshot.data() || {};
		const body = await req.json();
		const message = normalizeMessage(body?.message);
		const isSecret = normalizeBoolean(body?.isSecret);
		const imageUrls = normalizeImageUrls(body?.imageUrls);
		if (!message) {
			return jsonError(400, "Message is required.");
		}

		if (data.authorType === "anon") {
			if (!authContext?.isAdmin) {
				const pin = typeof body?.pin === "string" ? body.pin : "";
				if (!PIN_REGEX.test(pin)) {
					return jsonError(400, "PIN must be 4 digits.");
				}
				if (!verifyPin(pin, data.pinSalt, data.pinHash)) {
					return jsonError(403, "Invalid PIN.");
				}
			}
		} else {
			if (!authContext?.uid) {
				return jsonError(401, "Authentication required.");
			}
			if (!authContext.isAdmin && authContext.uid !== data.uid) {
				return jsonError(403, "Permission denied.");
			}
		}

		await docRef.update({
			message,
			isSecret,
			imageUrls,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return jsonOk({ id });
	} catch (error) {
		console.error("Error updating guestbook entry:", error);
		return jsonError(500, "Failed to update guestbook entry.");
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> }
) {
	const { id } = await params;
	if (!id) {
		return jsonError(400, "Entry id is required.");
	}

	try {
		const db = getDb();
		const authContext = await getAuthContext();
		const docRef = db.collection("guestbook").doc(id);
		const snapshot = await docRef.get();

		if (!snapshot.exists) {
			return jsonError(404, "Entry not found.");
		}

		const data = snapshot.data() || {};
		let body: Record<string, unknown> = {};
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			body = {};
		}

		if (data.authorType === "anon") {
			if (!authContext?.isAdmin) {
				const pin = typeof body?.pin === "string" ? body.pin : "";
				if (!PIN_REGEX.test(pin)) {
					return jsonError(400, "PIN must be 4 digits.");
				}
				if (!verifyPin(pin, data.pinSalt, data.pinHash)) {
					return jsonError(403, "Invalid PIN.");
				}
			}
		} else {
			if (!authContext?.uid) {
				return jsonError(401, "Authentication required.");
			}
			if (!authContext.isAdmin && authContext.uid !== data.uid) {
				return jsonError(403, "Permission denied.");
			}
		}

		await docRef.delete();
		return jsonOk({ id });
	} catch (error) {
		console.error("Error deleting guestbook entry:", error);
		return jsonError(500, "Failed to delete guestbook entry.");
	}
}
