import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { revalidateTag } from "next/cache";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getBucket, getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import { buildRateLimitKey, checkRateLimit } from "@/app/api/_lib/rateLimit";
import {
	buildSearchTokens,
	ensureUniqueSlug,
	normalizeSlug,
	normalizeStringArray,
} from "@/app/api/_lib/library";

import {
	actorFromAuth,
	emitNotification,
	getAdminRecipientUids,
} from "@/app/api/_lib/notifications";

export const runtime = "nodejs";

const getLibraryWritePermission = async (
	db: FirebaseFirestore.Firestore
): Promise<"admin" | "manager" | "member"> => {
	const docRef = db.collection("settings").doc("library");
	const snapshot = await docRef.get();
	const permission = snapshot.data()?.writePermission;
	if (permission === "admin" || permission === "manager" || permission === "member") {
		return permission;
	}
	return "admin";
};

export async function POST(req: NextRequest) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	if (!auth.auth.isAdmin) {
		const key = buildRateLimitKey(auth.auth, req, "library");
		const rateLimit = await checkRateLimit(key, {
			collection: "libraryRateLimits",
			cooldownMs: 5_000,
			minuteLimit: 2,
			hourLimit: 10,
		});
		if (rateLimit.ok === false) {
			const retryAfter = Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000));
			const message = rateLimit.reason === "cooldown"
				? `잠시 후 다시 시도해주세요. (${retryAfter}초)`
				: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.";
			return jsonError(429, message, { retryAfter });
		}
	}

	try {
		const db = getDb();
		const bucket = getBucket();
		const writePermission = await getLibraryWritePermission(db);
		const canWrite =
			writePermission === "member"
				? true
				: writePermission === "manager"
					? auth.auth.role === "manager" || auth.auth.role === "admin"
					: auth.auth.isAdmin === true;
		if (!canWrite) {
			return jsonError(403, "Write permission required.");
		}

		const body = await req.json();
		const {
			title,
			subtitle,
			tags,
			series,
			allow,
			password,
			thumbnail,
			slug,
			content,
		} = body ?? {};

		if (!title || !content) {
			return jsonError(400, "Title and content are required.");
		}

		const normalizedTitle = String(title).trim();
		const normalizedSubtitle = typeof subtitle === "string" ? subtitle : "";
		const normalizedTags = normalizeStringArray(tags);
		const normalizedSeries = typeof series === "string" ? series.trim() : "";
		const normalizedAllow = typeof allow === "string" ? allow : "all";
		const normalizedThumbnail = typeof thumbnail === "string" ? thumbnail : "";
		const normalizedSlug = normalizeSlug(slug);
		const normalizedAuthor =
			typeof body?.author === "string" && body.author.trim()
				? body.author.trim()
				: auth.auth.displayName || auth.auth.email || null;
		const normalizedAuthorUid = auth.auth.uid || null;
		const normalizedAuthorPhotoURL =
			typeof body?.authorPhotoURL === "string" && body.authorPhotoURL.trim()
				? body.authorPhotoURL.trim()
				: auth.auth.photoURL || null;
		const normalizedBackgroundType =
			typeof body?.backgroundType === "string" ? body.backgroundType : "default";
		const normalizedBackgroundColor =
			typeof body?.backgroundColor === "string" ? body.backgroundColor : null;
		const normalizedBackgroundImage =
			typeof body?.backgroundImage === "string" ? body.backgroundImage : null;
		const normalizedEnableBackdrop =
			typeof body?.enableBackdrop === "boolean" ? body.enableBackdrop : true;

		const postId = uuidv4();
		const uniqueSlug = await ensureUniqueSlug(db, normalizedSlug);
		const metadata = {
			title: normalizedTitle,
			subtitle: normalizedSubtitle,
			tags: normalizedTags,
			series: normalizedSeries,
			slug: uniqueSlug,
			author: normalizedAuthor,
			authorUid: normalizedAuthorUid,
			authorPhotoURL: normalizedAuthorPhotoURL,
			backgroundType: normalizedBackgroundType,
			backgroundColor: normalizedBackgroundColor,
			backgroundImage: normalizedBackgroundImage,
			enableBackdrop: normalizedEnableBackdrop,
			allow: normalizedAllow,
			password: normalizedAllow === "password" ? password : null,
			thumbnail: normalizedThumbnail,
			pinned: false,
			commentCount: 0,
			viewCount: 0,
			searchTokens: buildSearchTokens({
				title: normalizedTitle,
				subtitle: normalizedSubtitle,
				slug: uniqueSlug,
				tags: normalizedTags,
			}),
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		const postRef = db.collection("library").doc(postId);
		await postRef.set(metadata);

		const savedPost = await postRef.get();
		const savedData = savedPost.data();
		const convertedCreatedAt = savedData?.createdAt?.toDate?.()
			? savedData.createdAt.toDate().toISOString()
			: null;

		const contentPath = `library/create/contents/${postId}/content.json`;
		await bucket.file(contentPath).save(content, {
			contentType: "application/json",
		});

		if (normalizedSeries) {
			const seriesDocRef = db.collection("series").doc(normalizedSeries);
			const seriesDoc = await seriesDocRef.get();
			const postSummary = {
				id: postId,
				title: normalizedTitle,
				subtitle: normalizedSubtitle,
				author: normalizedAuthor,
				slug: uniqueSlug,
				thumbnail: normalizedThumbnail,
				createdAt: convertedCreatedAt,
			};
			if (seriesDoc.exists) {
				await seriesDocRef.update({
					posts: admin.firestore.FieldValue.arrayUnion(postSummary),
				});
			} else {
				await seriesDocRef.set({ posts: [postSummary] });
			}
			revalidateTag("library-series");
		}

		if (normalizedTags.length > 0) {
			for (const tag of normalizedTags) {
				const tagDocRef = db.collection("tags").doc(tag);
				const tagDoc = await tagDocRef.get();
				const postSummary = {
					id: postId,
					title: normalizedTitle,
					subtitle: normalizedSubtitle,
					author: normalizedAuthor,
					slug: uniqueSlug,
					thumbnail: normalizedThumbnail,
					createdAt: convertedCreatedAt,
				};
				if (tagDoc.exists) {
					await tagDocRef.update({
						posts: admin.firestore.FieldValue.arrayUnion(postSummary),
					});
				} else {
					await tagDocRef.set({ posts: [postSummary] });
				}
			}
			revalidateTag("library-tags");
		}

		try {
			await emitNotification({
				actor: actorFromAuth(auth.auth),
				recipients: await getAdminRecipientUids(),
				type: "libraryPost",
				category: "activity",
				message: `${auth.auth.displayName || "사용자"}님이 새 글을 발행했습니다`,
				excerpt: normalizedTitle,
				link: `/library/${uniqueSlug || postId}`,
			});
		} catch (notifyError) {
			console.error("Error emitting library post notification:", notifyError);
		}

		return jsonOk({ postId, createdAt: convertedCreatedAt, slug: uniqueSlug }, { status: 201 });
	} catch (error) {
		console.error("Error creating post:", error);
		return jsonError(500, "Failed to create post.");
	}
}
