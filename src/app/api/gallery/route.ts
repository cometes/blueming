import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";
import { buildRateLimitKey, checkRateLimit } from "@/app/api/_lib/rateLimit";
import {
	COLLECTION_NAME,
	MAX_LIMIT,
	formatTimestamp,
	normalizeCategory,
	normalizeDescription,
	normalizeTags,
	normalizeTitle,
	parsePositiveInt,
	toGalleryAuthor,
} from "@/app/api/_lib/gallery";

export const runtime = "nodejs";

const getGalleryWritePermission = async (
	db: FirebaseFirestore.Firestore
): Promise<"admin" | "manager" | "member"> => {
	const docRef = db.collection("settings").doc("gallery");
	const snapshot = await docRef.get();
	const permission = snapshot.data()?.writePermission;
	if (
		permission === "admin" ||
		permission === "manager" ||
		permission === "member"
	) {
		return permission;
	}
	return "member";
};

const toGalleryItem = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
	const data = doc.data() as Record<string, unknown>;
	return {
		id: doc.id,
		src: (data.imageUrl as string) || (data.src as string) || "",
		title: (data.title as string) || "",
		category: (data.category as string) || "Gallery",
		description: (data.description as string) || "",
		tags: Array.isArray(data.tags) ? data.tags : [],
		width: (data.width as number | undefined) ?? undefined,
		height: (data.height as number | undefined) ?? undefined,
		createdAt: formatTimestamp(data.createdAt),
		author: data.author ?? null,
		authorId: typeof data.authorId === "string" ? data.authorId : null,
	};
};

const matchesQuery = (item: ReturnType<typeof toGalleryItem>, query: string) => {
	if (!query) return true;
	const haystack = [
		item.title,
		item.category,
		item.description,
		...(Array.isArray(item.tags) ? item.tags : []),
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
	return haystack.includes(query);
};

const sortItems = (items: ReturnType<typeof toGalleryItem>[], sort: string) => {
	return [...items].sort((a, b) => {
		const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		return sort === "oldest" ? aTime - bTime : bTime - aTime;
	});
};

export async function GET(req: NextRequest) {
	try {
		const db = getDb();
		const limit = Math.min(
			parsePositiveInt(req.nextUrl.searchParams.get("limit"), 24),
			MAX_LIMIT
		);
		const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1);
		const sort = req.nextUrl.searchParams.get("sort") || "latest";
		const tag = req.nextUrl.searchParams.get("tag") || "";
		const queryParam =
			req.nextUrl.searchParams.get("q") ||
			req.nextUrl.searchParams.get("query") ||
			"";
		const query = queryParam.trim().toLowerCase();

		// 기본 경로(필터 없음): 서버 사이드 페이징 — 컬렉션 전량 로드 방지
		if (!tag && !query) {
			const [countSnapshot, pageSnapshot] = await Promise.all([
				db.collection(COLLECTION_NAME).count().get(),
				db
					.collection(COLLECTION_NAME)
					.orderBy("createdAt", sort === "oldest" ? "asc" : "desc")
					.offset((page - 1) * limit)
					.limit(limit)
					.get(),
			]);
			const items = pageSnapshot.docs.map(toGalleryItem);
			return jsonOk({ items, total: countSnapshot.data().count, page, limit });
		}

		// 태그 필터는 서버 where로 좁힌 뒤 인메모리 정렬/페이징
		// (orderBy를 함께 걸면 복합 인덱스가 필요해 where만 사용)
		let filterQuery: FirebaseFirestore.Query = db.collection(COLLECTION_NAME);
		if (tag) {
			filterQuery = filterQuery.where("tags", "array-contains", tag);
		}
		const snapshot = await filterQuery.get();
		if (snapshot.empty) {
			return jsonOk({ items: [], total: 0, page, limit });
		}

		const allItems = snapshot.docs.map(toGalleryItem);
		const filtered = query
			? allItems.filter((item) => matchesQuery(item, query))
			: allItems;
		const sorted = sortItems(filtered, sort);
		const total = sorted.length;
		const startIndex = (page - 1) * limit;
		const items = sorted.slice(startIndex, startIndex + limit);
		return jsonOk({ items, total, page, limit });
	} catch (error) {
		console.error("Gallery list error:", error);
		return jsonError(500, "갤러리 데이터를 불러오지 못했습니다.");
	}
}

export async function POST(req: NextRequest) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	if (!auth.auth.isAdmin) {
		const key = buildRateLimitKey(auth.auth, req, "gallery");
		const rateLimit = await checkRateLimit(key, {
			collection: "galleryRateLimits",
			cooldownMs: 5_000,
			minuteLimit: 3,
			hourLimit: 15,
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
		const writePermission = await getGalleryWritePermission(db);
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
		const imageUrl =
			typeof body?.imageUrl === "string"
				? body.imageUrl.trim()
				: typeof body?.src === "string"
					? body.src.trim()
					: "";
		if (!imageUrl) {
			return jsonError(400, "이미지를 업로드해주세요.");
		}
		const title = normalizeTitle(body?.title) || "갤러리 이미지";
		const tags = normalizeTags(body?.tags);
		const category = normalizeCategory(body?.category) || "Gallery";
		const description = normalizeDescription(body?.description);

		const authorName = auth.auth.displayName || "게스트";
		const authorAvatar = auth.auth.photoURL || "";

		const docRef = await db.collection(COLLECTION_NAME).add({
			authorId: auth.auth.uid,
			author: {
				id: auth.auth.uid,
				name: authorName,
				avatarUrl: authorAvatar,
			},
			imageUrl,
			title,
			category,
			description,
			tags,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		const snapshot = await docRef.get();
		if (!snapshot.exists) {
			return jsonError(500, "갤러리 저장에 실패했습니다.");
		}

		const data = snapshot.data() as Record<string, unknown>;
		return jsonOk(
			{
				id: snapshot.id,
				src: (data.imageUrl as string) || (data.src as string) || "",
				title: (data.title as string) || "",
				category: (data.category as string) || "Gallery",
				description: (data.description as string) || "",
				tags: Array.isArray(data.tags) ? data.tags : [],
				width: (data.width as number | undefined) ?? undefined,
				height: (data.height as number | undefined) ?? undefined,
				createdAt: formatTimestamp(data.createdAt),
				author: toGalleryAuthor(data),
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Gallery create error:", error);
		return jsonError(500, "갤러리 저장에 실패했습니다.");
	}
}
