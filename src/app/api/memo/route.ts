import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import { buildRateLimitKey, checkRateLimit } from "@/app/api/_lib/rateLimit";
import {
	COLLECTION_NAME,
	MAX_LIMIT,
	normalizeContent,
	normalizeImageUrls,
	normalizeTags,
	normalizeTitle,
	normalizeVisibility,
	parsePositiveInt,
	toMemoItem,
	toMemoItemFromDoc,
	matchesQuery,
} from "@/app/api/_lib/memo";

export const runtime = "nodejs";

const getMemoWritePermission = async (
	db: FirebaseFirestore.Firestore
): Promise<"admin" | "manager" | "member"> => {
	const docRef = db.collection("settings").doc("main");
	const snapshot = await docRef.get();
	const permission = snapshot.data()?.memo?.writePermission;
	if (
		permission === "admin" ||
		permission === "manager" ||
		permission === "member"
	) {
		return permission;
	}
	return "member";
};

export async function GET(req: NextRequest) {
	try {
		const db = getDb();
		const limit = Math.min(
			parsePositiveInt(req.nextUrl.searchParams.get("limit"), 24),
			MAX_LIMIT
		);
		const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1);
		const queryParam =
			req.nextUrl.searchParams.get("q") ||
			req.nextUrl.searchParams.get("query") ||
			"";
		const query = queryParam.trim().toLowerCase();

		const snapshot = await db
			.collection(COLLECTION_NAME)
			.orderBy("createdAt", "desc")
			.get();
		if (snapshot.empty) {
			return jsonOk({ items: [], total: 0, page, limit });
		}

		const allItems = snapshot.docs.map(toMemoItem);
		const filtered = query
			? allItems.filter((item) => matchesQuery(item, query))
			: allItems;
		const total = filtered.length;
		const startIndex = (page - 1) * limit;
		const items = filtered.slice(startIndex, startIndex + limit);
		return jsonOk({ items, total, page, limit });
	} catch (error) {
		console.error("Memo list error:", error);
		return jsonError(500, "메모 목록을 불러오지 못했습니다.");
	}
}

export async function POST(req: NextRequest) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const db = getDb();
		const writePermission = await getMemoWritePermission(db);
		const canWrite =
			writePermission === "member"
				? true
				: writePermission === "manager"
					? auth.auth.role === "manager" || auth.auth.role === "admin"
					: auth.auth.isAdmin === true;
		if (!canWrite) {
			return jsonError(403, "Write permission required.");
		}

		// 관리자 제외 Rate Limiting: 분당 5회, 시간당 20회
		if (!auth.auth.isAdmin) {
			const rlKey = buildRateLimitKey(auth.auth, req, "memo");
			const rl = await checkRateLimit(rlKey, {
				collection: "memoRateLimits",
				cooldownMs: 5_000,
				minuteLimit: 5,
				hourLimit: 20,
			});
			if (rl.ok === false) {
				const retryAfterSec = Math.ceil(rl.retryAfterMs / 1000);
				return jsonError(429, `메모 작성이 너무 빠릅니다. ${retryAfterSec}초 후 다시 시도해주세요.`, {
					retryAfter: retryAfterSec,
				});
			}
		}

		const body = await req.json();
		const title = normalizeTitle(body?.title) || "제목 없음";
		const content = normalizeContent(body?.content);
		if (!content) {
			return jsonError(400, "내용을 입력해주세요.");
		}
		const tags = normalizeTags(body?.tags);
		const visibility = normalizeVisibility(body?.visibility);
		const imageUrls = normalizeImageUrls(body?.imageUrls);
		const password =
			visibility === "protected" && typeof body?.password === "string"
				? body.password.trim()
				: "";
		if (visibility === "protected" && !password) {
			return jsonError(400, "보호글 비밀번호가 필요합니다.");
		}

		const authorName = auth.auth.displayName || "게스트";
		const authorAvatar = auth.auth.photoURL || "";

		const docRef = await db.collection(COLLECTION_NAME).add({
			title,
			content,
			visibility,
			password: visibility === "protected" ? password : null,
			authorId: auth.auth.uid,
			author: {
				id: auth.auth.uid,
				name: authorName,
				avatarUrl: authorAvatar,
			},
			tags,
			imageUrls,
			replyCount: 0,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(500, "메모 저장에 실패했습니다.");
		}

		return jsonOk(toMemoItemFromDoc(snapshot), { status: 201 });
	} catch (error) {
		console.error("Memo create error:", error);
		return jsonError(500, "메모 저장에 실패했습니다.");
	}
}
