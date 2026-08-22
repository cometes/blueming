"use client";

import { useMemo } from "react";
import type { LibraryItemSummary } from "@/features/library/types";

interface UseLibraryListPagingArgs {
	seriesData: LibraryItemSummary[];
	isSeriesOn: boolean;
	listTotalCount: number;
	postsPerPage: number;
	page: number;
	sort: string;
}

/**
 * 라이브러리 목록의 페이징 계산: 시리즈 정렬·클라이언트 페이징과
 * 총 페이지/안전한 현재 페이지/상세 이동용 쿼리.
 */
export function useLibraryListPaging({
	seriesData,
	isSeriesOn,
	listTotalCount,
	postsPerPage,
	page,
	sort,
}: UseLibraryListPagingArgs) {
	const filteredSeriesData = useMemo(() => {
		const sorted = [...seriesData].sort((a, b) => {
			if (sort === "title") {
				return (a.title || "").localeCompare(b.title || "");
			}
			const aTime = new Date(a.createdAt).getTime();
			const bTime = new Date(b.createdAt).getTime();
			return sort === "latest" ? bTime - aTime : aTime - bTime;
		});
		return sorted;
	}, [seriesData, sort]);

	const { totalPages, currentPageSafe, pagedSeriesData } = useMemo(() => {
		const totalItems = isSeriesOn ? filteredSeriesData.length : listTotalCount;
		const nextTotalPages = Math.max(1, Math.ceil(totalItems / postsPerPage));
		const nextCurrentPage = Math.min(page, nextTotalPages);
		const startIndex = (nextCurrentPage - 1) * postsPerPage;
		return {
			totalPages: nextTotalPages,
			currentPageSafe: nextCurrentPage,
			pagedSeriesData: filteredSeriesData.slice(
				startIndex,
				startIndex + postsPerPage,
			),
		};
	}, [filteredSeriesData, isSeriesOn, page, listTotalCount, postsPerPage]);

	const detailQuery = useMemo(() => {
		return currentPageSafe > 1 ? `?page=${currentPageSafe}` : "";
	}, [currentPageSafe]);

	return { totalPages, currentPageSafe, pagedSeriesData, detailQuery };
}
