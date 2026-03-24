import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getBucket, getDb } from "@/app/api/_lib/admin";
import { requireAdmin } from "@/app/api/_lib/auth";
import { normalizeStringArray } from "@/app/api/_lib/library";

export const runtime = "nodejs";

type PostSummary = {
	id: string;
	title: string;
	subtitle: string;
	slug: string | null;
	thumbnail: string;
	createdAt: string | null;
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

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> }
) {
	const auth = await requireAdmin();
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

		const metadata = docSnapshot.data() ?? {};
		const series = typeof metadata?.series === "string" ? metadata.series : "";
		const tags = normalizeStringArray(metadata?.tags);

		await docRef.delete();

		const contentPath = `library/create/contents/${documentId}/content.json`;
		try {
			await bucket.file(contentPath).delete({ ignoreNotFound: true });
		} catch (error) {
			console.error("Error deleting content file:", error);
		}

		if (series) {
			await removeCollectionPost(db, "series", series, documentId);
			revalidateTag("library-series");
		}

		if (tags.length > 0) {
			for (const tag of tags) {
				await removeCollectionPost(db, "tags", tag, documentId);
			}
			revalidateTag("library-tags");
		}

		return jsonOk({ postId: documentId });
	} catch (error) {
		console.error("Error deleting post:", error);
		return jsonError(500, "Failed to delete post.");
	}
}
