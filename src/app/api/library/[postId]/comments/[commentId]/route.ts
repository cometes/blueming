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
	updateLibraryCommentCount,
	verifyPin,
} from "@/app/api/_lib/libraryComments";

export const runtime = "nodejs";

const getCommentCollection = (
	db: FirebaseFirestore.Firestore,
	postId: string
) => db.collection("library").doc(postId).collection("comments");

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ postId?: string; commentId?: string }> }
) {
	const { postId, commentId } = await params;
	if (!postId || !commentId) {
		return jsonError(400, "Post id and comment id are required.");
	}

	const db = getDb();
	try {
		const authContext = await getAuthContext();
		const docRef = getCommentCollection(db, postId).doc(commentId);
		const snapshot = await docRef.get();

		if (!snapshot.exists) {
			return jsonError(404, "Comment not found.");
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

		return jsonOk({ id: commentId });
	} catch (error) {
		console.error("Error updating comment:", error);
		return jsonError(500, "Failed to update comment.");
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ postId?: string; commentId?: string }> }
) {
	const { postId, commentId } = await params;
	if (!postId || !commentId) {
		return jsonError(400, "Post id and comment id are required.");
	}

	const db = getDb();
	try {
		const authContext = await getAuthContext();
		const docRef = getCommentCollection(db, postId).doc(commentId);
		const snapshot = await docRef.get();

		if (!snapshot.exists) {
			return jsonError(404, "Comment not found.");
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
		await updateLibraryCommentCount(postId, -1);
		return jsonOk({ id: commentId });
	} catch (error) {
		console.error("Error deleting comment:", error);
		return jsonError(500, "Failed to delete comment.");
	}
}
