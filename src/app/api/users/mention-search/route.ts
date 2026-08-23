import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

const MAX_RESULTS = 8;

/**
 * @멘션 자동완성용 회원 검색.
 * - requireAuth (회원만 사용), 노출 필드는 uid/displayName/photoURL만.
 * - Firestore는 부분일치 쿼리가 불가하므로 active 회원 전체를 읽어
 *   서버에서 필터한다 (소규모 회원 전제 — admin/users 목록 API와 동일 설계).
 */
export async function GET(req: NextRequest) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const query = (req.nextUrl.searchParams.get("q") || "")
			.trim()
			.toLowerCase();
		const db = getDb();
		const snapshot = await db
			.collection("users")
			.where("status", "==", "active")
			.limit(200)
			.get();

		const items = snapshot.docs
			.map((doc) => {
				const data = doc.data() || {};
				return {
					uid: doc.id,
					displayName:
						typeof data.displayName === "string" ? data.displayName : "",
					photoURL: typeof data.photoURL === "string" ? data.photoURL : "",
				};
			})
			.filter(
				(user) =>
					user.displayName &&
					(query === "" ||
						user.displayName.toLowerCase().includes(query)),
			)
			.slice(0, MAX_RESULTS);

		return jsonOk({ items });
	} catch (error) {
		console.error("Error searching mention users:", error);
		return jsonError(500, "회원 검색에 실패했습니다.");
	}
}
