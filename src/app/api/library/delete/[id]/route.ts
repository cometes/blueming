import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getBucket, getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import { normalizeStringArray } from "@/app/api/_lib/library";
import {
	EDITOR_IMAGE_PREFIX,
	extractStoragePaths,
} from "@/app/api/_lib/imageRefs";

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

		const metadata = docSnapshot.data() ?? {};
		const authorUid = typeof metadata?.authorUid === "string" ? metadata.authorUid : null;
		if (authorUid !== auth.auth.uid && !auth.auth.isAdmin && auth.auth.role !== "manager") {
			return jsonError(403, "삭제 권한이 없습니다.");
		}
		const series = typeof metadata?.series === "string" ? metadata.series : "";
		const tags = normalizeStringArray(metadata?.tags);

		// 본문 이미지 수집은 반드시 문서/본문 삭제 "전에" 수행한다.
		// 삭제 대상은 에디터 업로드 prefix(library/create/images/) 아래로 한정 —
		// 에셋 피커 등에서 온 공용 이미지를 지우지 않기 위함.
		// (평면 폴더라 여러 글이 같은 파일을 참조(복붙)할 수 있는 이론적 리스크는
		//  개인 블로그 규모에서 수용, 잔여물은 관리자 일괄 정리가 안전망)
		const contentPath = `library/create/contents/${documentId}/content.json`;
		const imagePaths = new Set<string>();
		try {
			const [contentBuffer] = await bucket.file(contentPath).download();
			for (const path of extractStoragePaths(
				contentBuffer.toString("utf-8"),
				bucket.name,
			)) {
				if (path.startsWith(EDITOR_IMAGE_PREFIX)) imagePaths.add(path);
			}
		} catch {
			// 본문 파일이 없어도 글 삭제는 진행
		}
		// 썸네일 등 문서 메타데이터에 박힌 자기 버킷 이미지도 수집
		for (const path of extractStoragePaths(JSON.stringify(metadata), bucket.name)) {
			if (path.startsWith(EDITOR_IMAGE_PREFIX)) imagePaths.add(path);
		}

		await docRef.delete();

		try {
			await bucket.file(contentPath).delete({ ignoreNotFound: true });
		} catch (error) {
			console.error("Error deleting content file:", error);
		}

		// 본문 이미지 삭제 실패는 비치명 — 로그만 남기고 계속 진행
		await Promise.all(
			Array.from(imagePaths).map((path) =>
				bucket
					.file(path)
					.delete({ ignoreNotFound: true })
					.catch((error) =>
						console.warn(`Error deleting post image ${path}:`, error),
					),
			),
		);

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
