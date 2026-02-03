import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { getAuthContext } from "@/app/api/_lib/auth";
import { PIN_REGEX, verifyPin } from "@/app/api/_lib/libraryComments";

export const runtime = "nodejs";

const getCommentCollection = (
	db: FirebaseFirestore.Firestore,
	postId: string
) => db.collection("library").doc(postId).collection("comments");

export async function POST(
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
		const postSnapshot = await db.collection("library").doc(postId).get();
		const postData = postSnapshot.exists ? postSnapshot.data() || {} : {};
		const postAuthorId =
			typeof postData.authorUid === "string"
				? postData.authorUid
				: typeof postData.authorId === "string"
					? postData.authorId
					: typeof postData.uid === "string"
						? postData.uid
						: null;
		const isPostAuthor =
			Boolean(postAuthorId) && authContext?.uid === postAuthorId;
		const docRef = getCommentCollection(db, postId).doc(commentId);
		const snapshot = await docRef.get();

		if (!snapshot.exists) {
			return jsonError(404, "Comment not found.");
		}

		const data = snapshot.data() || {};
		if (data.isSecret !== true) {
			return jsonError(400, "Comment is not secret.");
		}

		let body: Record<string, unknown> = {};
		try {
			body = (await req.json()) as Record<string, unknown>;
		} catch {
			body = {};
		}

		if (data.authorType === "anon") {
			if (!authContext?.isAdmin && !isPostAuthor) {
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
			if (!authContext.isAdmin && authContext.uid !== data.uid && !isPostAuthor) {
				return jsonError(403, "Permission denied.");
			}
		}

		return jsonOk({
			message: data.message || "",
			imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
		});
	} catch (error) {
		console.error("Error verifying comment:", error);
		return jsonError(500, "Failed to verify comment.");
	}
}
