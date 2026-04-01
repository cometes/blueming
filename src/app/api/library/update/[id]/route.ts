import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { revalidateTag } from "next/cache";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getBucket, getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import {
	buildSearchTokens,
	ensureUniqueSlug,
	normalizeSlug,
	normalizeStringArray,
} from "@/app/api/_lib/library";

export const runtime = "nodejs";

type PostSummary = {
	id: string;
	title: string;
	subtitle: string;
	author: string | null;
	slug: string | null;
	thumbnail: string;
	createdAt: string | null;
};

const upsertCollectionPost = async (
	db: FirebaseFirestore.Firestore,
	collection: "series" | "tags",
	docId: string,
	postSummary: PostSummary
) => {
	const docRef = db.collection(collection).doc(docId);
	const snapshot = await docRef.get();
	const currentPosts = Array.isArray(snapshot.data()?.posts)
		? (snapshot.data()?.posts as PostSummary[])
		: [];
	const nextPosts = [...currentPosts];
	const index = nextPosts.findIndex((post) => post.id === postSummary.id);
	if (index >= 0) {
		nextPosts[index] = postSummary;
	} else {
		nextPosts.push(postSummary);
	}
	await docRef.set({ posts: nextPosts }, { merge: true });
};

const removeCollectionPost = async (
	db: FirebaseFirestore.Firestore,
	collection: "series" | "tags",
	docId: string,
	postId: string
) => {
	const docRef = db.collection(collection).doc(docId);
	const snapshot = await docRef.get();
	if (!snapshot.exists) return;
	const currentPosts = Array.isArray(snapshot.data()?.posts)
		? (snapshot.data()?.posts as PostSummary[])
		: [];
	const nextPosts = currentPosts.filter((post) => post.id !== postId);
	await docRef.set({ posts: nextPosts }, { merge: true });
};

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> }
) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	const { id: documentId } = await params;
	if (!documentId) {
		return jsonError(400, "Document id is required.");
	}

	try {
		const db = getDb();
		const bucket = getBucket();
		const docRef = db.collection("library").doc(documentId);
		const docSnapshot = await docRef.get();

		if (!docSnapshot.exists) {
			return jsonError(404, "Document not found.");
		}

		const previousData = docSnapshot.data() ?? {};
		const authorUid = typeof previousData?.authorUid === "string" ? previousData.authorUid : null;
		if (authorUid !== auth.auth.uid && !auth.auth.isAdmin) {
			return jsonError(403, "수정 권한이 없습니다.");
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
			pinned,
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
				: typeof previousData?.author === "string"
					? previousData.author
					: auth.auth.displayName || auth.auth.email || null;
		const normalizedAuthorUid =
			typeof previousData?.authorUid === "string"
				? previousData.authorUid
				: auth.auth.uid || null;
		const normalizedAuthorPhotoURL =
			typeof body?.authorPhotoURL === "string" && body.authorPhotoURL.trim()
				? body.authorPhotoURL.trim()
				: typeof previousData?.authorPhotoURL === "string"
					? previousData.authorPhotoURL
					: auth.auth.photoURL || null;
		const normalizedBackgroundType =
			typeof body?.backgroundType === "string"
				? body.backgroundType
				: typeof previousData?.backgroundType === "string"
					? previousData.backgroundType
					: "default";
		const normalizedBackgroundColor =
			typeof body?.backgroundColor === "string"
				? body.backgroundColor
				: typeof previousData?.backgroundColor === "string"
					? previousData.backgroundColor
					: null;
		const normalizedBackgroundImage =
			typeof body?.backgroundImage === "string"
				? body.backgroundImage
				: typeof previousData?.backgroundImage === "string"
					? previousData.backgroundImage
					: null;
		const normalizedEnableBackdrop =
			typeof body?.enableBackdrop === "boolean"
				? body.enableBackdrop
				: typeof previousData?.enableBackdrop === "boolean"
					? previousData.enableBackdrop
					: true;
		const normalizedPinned =
			typeof pinned === "boolean"
				? pinned
				: (previousData?.pinned as boolean | undefined) ?? false;

		const uniqueSlug = await ensureUniqueSlug(db, normalizedSlug, documentId);
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
			pinned: normalizedPinned,
			searchTokens: buildSearchTokens({
				title: normalizedTitle,
				subtitle: normalizedSubtitle,
				slug: uniqueSlug,
				tags: normalizedTags,
			}),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		await docRef.update(metadata);

		const existingCreatedAt = previousData?.createdAt?.toDate?.()
			? previousData.createdAt.toDate().toISOString()
			: null;

		const postSummary: PostSummary = {
			id: documentId,
			title: normalizedTitle,
			subtitle: normalizedSubtitle,
			author: normalizedAuthor,
			slug: uniqueSlug,
			thumbnail: normalizedThumbnail,
			createdAt: existingCreatedAt,
		};

		const contentPath = `library/create/contents/${documentId}/content.json`;
		await bucket.file(contentPath).save(content, {
			contentType: "application/json",
		});

		const previousSeries =
			typeof previousData?.series === "string" ? previousData.series : "";
		const previousTags = normalizeStringArray(previousData?.tags);

		if (previousSeries && previousSeries !== normalizedSeries) {
			await removeCollectionPost(db, "series", previousSeries, documentId);
		}
		if (normalizedSeries) {
			await upsertCollectionPost(db, "series", normalizedSeries, postSummary);
		}

		for (const tag of previousTags) {
			if (!normalizedTags.includes(tag)) {
				await removeCollectionPost(db, "tags", tag, documentId);
			}
		}

		for (const tag of normalizedTags) {
			await upsertCollectionPost(db, "tags", tag, postSummary);
		}
		revalidateTag("library-series");
		revalidateTag("library-tags");

		return jsonOk({ postId: documentId, slug: uniqueSlug });
	} catch (error) {
		console.error("Error updating post:", error);
		return jsonError(500, "Failed to update post.");
	}
}
