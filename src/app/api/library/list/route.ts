import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import {
	parsePositiveInt,
	matchesQuery,
	sortItems,
	toLibraryItem,
	buildQueryTokens,
} from "@/app/api/_lib/library";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	try {
		const db = getDb();
		const params = req.nextUrl.searchParams;
		const limit = parsePositiveInt(params.get("limit"), 10);
		const page = parsePositiveInt(params.get("page"), 1);
		const sort = params.get("sort") || "latest";
		const tag = params.get("tag") || "";
		const queryParam = params.get("q") || params.get("query") || "";
		const query = queryParam.trim().toLowerCase();

		const hasTagFilter = tag && tag !== "전체";
		let baseQuery: FirebaseFirestore.Query = db.collection("library");
		if (hasTagFilter) {
			baseQuery = baseQuery.where("tags", "array-contains", tag);
		}

		if (hasTagFilter) {
			const snapshot = await baseQuery.get();
			const allItems = snapshot.docs.map(toLibraryItem);
			const filtered = query
				? allItems.filter((item) => matchesQuery(item, query))
				: allItems;
			const sorted = sortItems(filtered, sort);
			const total = sorted.length;
			const startIndex = (page - 1) * limit;
			const items = sorted.slice(startIndex, startIndex + limit);
			return jsonOk({ items, total, page, limit });
		}

		if (sort === "title") {
			baseQuery = baseQuery.orderBy("pinned", "desc").orderBy("title", "asc");
		} else {
			baseQuery = baseQuery
				.orderBy("pinned", "desc")
				.orderBy("createdAt", sort === "oldest" ? "asc" : "desc");
		}

		if (query) {
			const tokens = buildQueryTokens(query);
			let searchQuery: FirebaseFirestore.Query = baseQuery;
			let usedTokenSearch = false;
			if (tokens.length > 0 && !tag) {
				searchQuery = searchQuery.where("searchTokens", "array-contains-any", tokens);
				usedTokenSearch = true;
			}

			// 토큰 검색 1회 → 매칭이 없을 때만 전체 스캔 1회로 폴백.
			// (기존에는 최악의 경우 전체 컬렉션을 직렬로 4번 읽었음)
			const snapshot = await searchQuery.get();
			let filtered = snapshot.docs
				.map(toLibraryItem)
				.filter((item) => matchesQuery(item, query));

			if (filtered.length === 0 && usedTokenSearch) {
				const fallbackSnapshot = await baseQuery.get();
				filtered = fallbackSnapshot.docs
					.map(toLibraryItem)
					.filter((item) => matchesQuery(item, query));
			}

			if (filtered.length === 0) {
				return jsonOk({ items: [], total: 0, page, limit });
			}
			const sorted = sortItems(filtered, sort);
			const total = sorted.length;
			const startIndex = (page - 1) * limit;
			const items = sorted.slice(startIndex, startIndex + limit);

			return jsonOk({ items, total, page, limit });
		}

		// 기본 경로: 서버 사이드 페이징 (photoboard 패턴).
		// baseQuery는 이미 pinned desc + 정렬 필드 순 — 고정글이 항상 앞에
		// 오므로 고정글 수만큼 offset 하면 비고정글 페이지가 정확히 잘린다.
		// (이 복합 정렬은 기존 검색 경로에서 사용 중이라 인덱스가 이미 존재)
		const [pinnedSnapshot, countSnapshot] = await Promise.all([
			db.collection("library").where("pinned", "==", true).get(),
			db.collection("library").count().get(),
		]);
		const pinnedItems = pinnedSnapshot.docs.map(toLibraryItem);
		const total = Math.max(0, countSnapshot.data().count - pinnedItems.length);

		if (total === 0 && pinnedItems.length === 0) {
			return jsonOk({ items: [], pinnedItems: [], total: 0, page, limit });
		}

		const pageSnapshot = await baseQuery
			.offset(pinnedItems.length + (page - 1) * limit)
			.limit(limit)
			.get();
		const items = pageSnapshot.docs.map(toLibraryItem);

		return jsonOk({ items, pinnedItems, total, page, limit });
	} catch (error) {
		console.error("Error fetching documents:", error);
		return jsonError(500, "Failed to fetch documents.");
	}
}
