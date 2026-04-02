import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getBucket, getDb } from "@/app/api/_lib/admin";
import { getAuthContext } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> }
) {
	const { id: documentId } = await params;
	if (!documentId) {
		return jsonError(400, "Document id is required.");
	}

	try {
		const db = getDb();
		const bucket = getBucket();
		const docRef = db.collection("library").doc(documentId);
		let docSnapshot = await docRef.get();
		let resolvedId = documentId;

		if (!docSnapshot.exists) {
			const slugSnapshot = await db
				.collection("library")
				.where("slug", "==", documentId)
				.limit(1)
				.get();
			if (!slugSnapshot.empty) {
				docSnapshot = slugSnapshot.docs[0];
				resolvedId = docSnapshot.id;
			}
		}

		if (!docSnapshot.exists) {
			return jsonError(404, "Document not found in library collection.");
		}

		const metadata = docSnapshot.data() ?? {};
		const formattedCreatedAt =
			metadata.createdAt && metadata.createdAt.toDate
				? metadata.createdAt.toDate().toISOString()
				: null;

		const requiresPassword = metadata.allow === "password";
		const isSecret = metadata.allow === "secret";
		const authContext = await getAuthContext();
		const authorUid =
			typeof metadata.authorUid === "string" ? metadata.authorUid : null;
		const isOwner = Boolean(authorUid) && authContext?.uid === authorUid;
		const bypassPassword = Boolean(authContext?.isAdmin || isOwner);

		if (isSecret && !bypassPassword) {
			return jsonError(403, "이 게시글은 작성자와 관리자만 열람할 수 있습니다.");
		}

		const rawHeaderPassword = req.headers.get("x-post-password") || "";
		const headerPassword = rawHeaderPassword ? decodeURIComponent(rawHeaderPassword) : "";
		const queryPassword = req.nextUrl.searchParams.get("password") || "";
		const providedPassword = headerPassword || queryPassword;

		if (requiresPassword && !bypassPassword && !providedPassword) {
			return jsonOk({
				id: resolvedId,
				title: metadata.title,
				subtitle: metadata.subtitle,
				author: metadata.author || null,
				authorPhotoURL: metadata.authorPhotoURL || null,
				backgroundType: metadata.backgroundType || "default",
				backgroundColor: metadata.backgroundColor || null,
				backgroundImage: metadata.backgroundImage || null,
				enableBackdrop:
					typeof metadata.enableBackdrop === "boolean"
						? metadata.enableBackdrop
						: true,
				slug: metadata.slug || null,
				createdAt: formattedCreatedAt,
				allow: metadata.allow,
				password: null,
				thumbnail: metadata.thumbnail,
				series: metadata.series,
				tags: metadata.tags,
				pinned: metadata.pinned === true,
				content: null,
				requiresPassword: true,
				prevPost: null,
				nextPost: null,
			});
		}

		if (requiresPassword && !bypassPassword && providedPassword !== metadata.password) {
			return jsonError(403, "비밀번호가 일치하지 않습니다.", { requiresPassword: true });
		}

		const contentPath = `library/create/contents/${resolvedId}/content.json`;
		const file = bucket.file(contentPath);
		let content = "";
		try {
			const [fileData] = await file.download();
			content = fileData.toString();
		} catch (storageError) {
			console.error("Error fetching content from Storage:", storageError);
			return jsonError(500, "Failed to fetch content from Storage.");
		}

		const collectionRef = db.collection("library");
		const allDocsSnapshot = await collectionRef.orderBy("createdAt").get();
		const allDocs = allDocsSnapshot.docs.map((doc) => ({
			id: doc.id,
			title: doc.data().title,
			slug: doc.data().slug || null,
			createdAt: doc.data().createdAt?.toDate?.().toISOString() || null,
		}));
		const currentIndex = allDocs.findIndex((doc) => doc.id === resolvedId);
		const prevPost = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
		const nextPost =
			currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

		return jsonOk({
			id: resolvedId,
			title: metadata.title,
			subtitle: metadata.subtitle,
			author: metadata.author || null,
			authorPhotoURL: metadata.authorPhotoURL || null,
			backgroundType: metadata.backgroundType || "default",
			backgroundColor: metadata.backgroundColor || null,
			backgroundImage: metadata.backgroundImage || null,
			enableBackdrop:
				typeof metadata.enableBackdrop === "boolean"
					? metadata.enableBackdrop
					: true,
			slug: metadata.slug || null,
			createdAt: formattedCreatedAt,
			allow: metadata.allow,
			password: null,
			thumbnail: metadata.thumbnail,
			series: metadata.series,
			tags: metadata.tags,
			pinned: metadata.pinned === true,
			content,
			requiresPassword: false,
			prevPost: prevPost
				? { id: prevPost.id, title: prevPost.title, slug: prevPost.slug }
				: null,
			nextPost: nextPost
				? { id: nextPost.id, title: nextPost.title, slug: nextPost.slug }
				: null,
		});
	} catch (error) {
		console.error("Error fetching document:", error);
		return jsonError(500, "Failed to fetch document.");
	}
}
