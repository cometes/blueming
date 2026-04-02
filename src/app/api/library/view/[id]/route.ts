import "server-only";
import crypto from "crypto";
import { type NextRequest } from "next/server";
import { getDb } from "@/app/api/_lib/admin";
import { getAuthContext } from "@/app/api/_lib/auth";
import { jsonOk } from "@/app/api/_lib/response";
import { FieldValue } from "firebase-admin/firestore";

function getViewerHash(req: NextRequest, uid?: string): string {
	if (uid) return uid;
	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		req.headers.get("x-real-ip") ??
		"unknown";
	const ua = req.headers.get("user-agent") ?? "unknown";
	return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id?: string }> },
) {
	try {
		const { id: postId } = await params;
		if (!postId) return jsonOk({ counted: false, viewCount: 0 });

		const db = getDb();
		const authContext = await getAuthContext();

		// 게시글 조회 → authorUid 확인
		const postRef = db.collection("library").doc(postId);
		const postSnap = await postRef.get();
		if (!postSnap.exists) return jsonOk({ counted: false, viewCount: 0 });

		const postData = postSnap.data() ?? {};
		const authorUid = typeof postData.authorUid === "string" ? postData.authorUid : null;
		const currentViewCount = typeof postData.viewCount === "number" ? postData.viewCount : 0;

		// 작성자/관리자 본인 조회는 카운트하지 않음
		if (authContext?.isAdmin || (authorUid && authContext?.uid === authorUid)) {
			return jsonOk({ counted: false, viewCount: currentViewCount });
		}

		// viewerHash 결정
		const viewerHash = getViewerHash(req, authContext?.uid);
		const viewerType: "auth" | "anon" = authContext?.uid ? "auth" : "anon";
		const viewDocId = `${postId}_${viewerHash}`;
		const viewDocRef = db.collection("library_views").doc(viewDocId);

		// 트랜잭션: 중복 확인 + 원자적 increment
		const result = await db.runTransaction(async (tx) => {
			const viewSnap = await tx.get(viewDocRef);
			if (viewSnap.exists) {
				const latestPost = await tx.get(postRef);
				const latestCount = typeof latestPost.data()?.viewCount === "number"
					? (latestPost.data()?.viewCount as number)
					: currentViewCount;
				return { counted: false, viewCount: latestCount };
			}

			tx.set(viewDocRef, {
				postId,
				viewerHash,
				viewerType,
				createdAt: FieldValue.serverTimestamp(),
			});
			tx.update(postRef, { viewCount: FieldValue.increment(1) });

			return { counted: true, viewCount: currentViewCount + 1 };
		});

		return jsonOk(result);
	} catch {
		return jsonOk({ counted: false, viewCount: 0 });
	}
}
