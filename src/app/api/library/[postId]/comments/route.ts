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
	normalizeName,
	parsePositiveInt,
	updateLibraryCommentCount,
	hashPin,
} from "@/app/api/_lib/libraryComments";
import { buildRateLimitKey, checkRateLimit } from "@/app/api/_lib/rateLimit";

export const runtime = "nodejs";

const getCommentCollection = (
	db: FirebaseFirestore.Firestore,
	postId: string
) => db.collection("library").doc(postId).collection("comments");

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ postId?: string }> }
) {
	const { postId } = await params;
	if (!postId) {
		return jsonError(400, "Post id is required.");
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
		const limit = parsePositiveInt(req.nextUrl.searchParams.get("limit"), 20);
		const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1);
		const offset = (page - 1) * limit;

		const baseQuery = getCommentCollection(db, postId).orderBy(
			"createdAt",
			"asc"
		);
		const countSnapshot = await baseQuery.count().get();
		const total = countSnapshot.data().count || 0;

		if (total === 0) {
			return jsonOk({ items: [], total: 0, page, limit });
		}

		const snapshot = await baseQuery.offset(offset).limit(limit).get();
		const items = snapshot.docs.map((doc) => {
			const data = doc.data();
			const isSecret = data.isSecret === true;
			const isAnon = data.authorType === "anon";
			const isAuthor =
				authContext?.uid &&
				data.authorType === "user" &&
				data.uid === authContext.uid;
			const isOwn = Boolean(isAuthor);
			const canViewDirectly =
				!isSecret || authContext?.isAdmin || isAuthor || isPostAuthor;
			const canViewSecret = isSecret ? isAnon || canViewDirectly : false;
			const canEdit = isAnon
				? true
				: authContext?.isAdmin
					? data.isAdmin === true
					: Boolean(authContext?.uid && data.uid === authContext.uid);
			const canDelete = isAnon
				? true
				: Boolean(authContext?.isAdmin || authContext?.uid === data.uid);
			const masked = isSecret && !canViewDirectly;
			const displayMessage = canViewDirectly ? data.message : "비밀글입니다.";
			const displayImageUrls =
				canViewDirectly && Array.isArray(data.imageUrls)
					? data.imageUrls
					: [];
			const authorLabel = data.isAdmin === true ? "관리자" : isAnon ? "익명" : "";
			return {
				id: doc.id,
				postId,
				authorType: data.authorType,
				displayName: data.displayName,
				uid: data.uid || null,
				photoURL: data.photoURL || null,
				message: displayMessage,
				imageUrls: displayImageUrls,
				isSecret,
				isAdmin: data.isAdmin === true,
				canEdit,
				canDelete,
				canViewSecret,
				masked,
				isOwn,
				displayMessage,
				displayImageUrls,
				authorLabel,
				createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
			};
		});

		return jsonOk({ items, total, page, limit });
	} catch (error) {
		console.error("Error fetching comments:", error);
		return jsonError(500, "Failed to fetch comments.");
	}
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ postId?: string }> }
) {
	const { postId } = await params;
	if (!postId) {
		return jsonError(400, "Post id is required.");
	}

	const db = getDb();
	try {
		const authContext = await getAuthContext();

		// Rate Limiting: 분당 5회, 시간당 30회
		const rlKey = buildRateLimitKey(authContext, req, "comment");
		const rl = await checkRateLimit(rlKey, {
			collection: "commentRateLimits",
			cooldownMs: 5_000,
			minuteLimit: 5,
			hourLimit: 30,
		});
		if (rl.ok === false) {
			const retryAfterSec = Math.ceil(rl.retryAfterMs / 1000);
			return jsonError(429, `댓글 작성이 너무 빠릅니다. ${retryAfterSec}초 후 다시 시도해주세요.`, {
				retryAfter: retryAfterSec,
			});
		}

		const body = await req.json();
		const message = normalizeMessage(body?.message);
		const displayName = normalizeName(body?.displayName);
		const pin = typeof body?.pin === "string" ? body.pin : "";
		const isSecret = normalizeBoolean(body?.isSecret);
		const imageUrls = normalizeImageUrls(body?.imageUrls);

		if (!message) {
			return jsonError(400, "Message is required.");
		}

		if (authContext?.uid) {
			const entry = {
				postId,
				authorType: "user",
				uid: authContext.uid,
				displayName: authContext.displayName || displayName || "사용자",
				photoURL: authContext.photoURL || "",
				isAdmin: authContext.isAdmin === true,
				isSecret,
				imageUrls,
				message,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: null,
			};

			const docRef = await getCommentCollection(db, postId).add(entry);
			await updateLibraryCommentCount(postId, 1);
			return jsonOk({ id: docRef.id }, { status: 201 });
		}

		if (!displayName) {
			return jsonError(400, "Display name is required.");
		}
		if (!PIN_REGEX.test(pin)) {
			return jsonError(400, "PIN must be 4 digits.");
		}

		const { salt, hash } = hashPin(pin);
		const entry = {
			postId,
			authorType: "anon",
			displayName,
			isSecret,
			imageUrls,
			message,
			pinSalt: salt,
			pinHash: hash,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: null,
		};

		const docRef = await getCommentCollection(db, postId).add(entry);
		await updateLibraryCommentCount(postId, 1);
		return jsonOk({ id: docRef.id }, { status: 201 });
	} catch (error) {
		console.error("Error creating comment:", error);
		return jsonError(500, "Failed to create comment.");
	}
}
