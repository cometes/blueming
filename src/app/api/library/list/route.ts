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

			const snapshot = await searchQuery.get();
			let searchItems = snapshot.docs.map(toLibraryItem);

			if (snapshot.empty && usedTokenSearch) {
				const fallbackSnapshot = await baseQuery.get();
				searchItems = fallbackSnapshot.docs.map(toLibraryItem);
			}

			let filtered = searchItems.filter((item) => matchesQuery(item, query));
			if (filtered.length === 0 && usedTokenSearch) {
				const fallbackSnapshot = await baseQuery.get();
				const fallbackItems = fallbackSnapshot.docs.map(toLibraryItem);
				filtered = fallbackItems.filter((item) => matchesQuery(item, query));
			}

			if (filtered.length === 0) {
				const broadSnapshot = await db.collection("library").get();
				const broadItems = broadSnapshot.docs.map(toLibraryItem);
				filtered = broadItems.filter((item) => matchesQuery(item, query));
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

		const snapshot = await db.collection("library").get();
		if (snapshot.empty) {
			return jsonOk({ items: [], pinnedItems: [], total: 0, page, limit });
		}

		const allItems = snapshot.docs.map(toLibraryItem);
		const pinnedItems = allItems.filter((item) => item.pinned);
		const nonPinnedItems = allItems.filter((item) => !item.pinned);
		const sorted = sortItems(nonPinnedItems, sort);
		const total = sorted.length;
		const startIndex = (page - 1) * limit;
		const items = sorted.slice(startIndex, startIndex + limit);

		return jsonOk({ items, pinnedItems, total, page, limit });
	} catch (error) {
		console.error("Error fetching documents:", error);
		return jsonError(500, "Failed to fetch documents.");
	}
}
