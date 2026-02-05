import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface UseLibraryFiltersParams {
	isSeriesOn: boolean;
}

export const useLibraryFilters = ({ isSeriesOn }: UseLibraryFiltersParams) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// URL에서 직접 읽기
	const page = Number(searchParams.get("page")) || 1;
	const sort = (searchParams.get("sort") as "latest" | "oldest" | "title") || "latest";
	const tag = searchParams.get("tag") || "전체";
	const query = searchParams.get("query") || "";

	// URL 업데이트 헬퍼
	const updateURL = useCallback(
		(updates: Record<string, string | number | null>) => {
			const params = new URLSearchParams(searchParams.toString());

			Object.entries(updates).forEach(([key, value]) => {
				if (value === null || value === "" || value === "전체") {
					params.delete(key);
				} else {
					params.set(key, String(value));
				}
			});

			const queryString = params.toString();
			router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
				scroll: false,
			});
		},
		[pathname, router, searchParams]
	);

	// 페이지 변경
	const setPage = useCallback(
		(newPage: number) => {
			updateURL({ page: newPage === 1 ? null : newPage });
		},
		[updateURL]
	);

	// 정렬 변경
	const setSort = useCallback(
		(newSort: "latest" | "oldest" | "title") => {
			updateURL({ sort: newSort === "latest" ? null : newSort, page: null });
		},
		[updateURL]
	);

	// 태그 변경
	const setTag = useCallback(
		(newTag: string) => {
			updateURL({ tag: newTag, page: null, query: null });
		},
		[updateURL]
	);

	// 검색어 변경
	const setQuery = useCallback(
		(newQuery: string) => {
			updateURL({ query: newQuery, page: null, tag: null });
		},
		[updateURL]
	);

	// 검색어 초기화
	const clearSearch = useCallback(() => {
		updateURL({ query: null, page: null, tag: null });
	}, [updateURL]);

	return {
		// 현재 상태 (URL에서 읽음)
		page,
		sort,
		tag,
		query,

		// 상태 변경 함수
		setPage,
		setSort,
		setTag,
		setQuery,
		clearSearch,
	};
};
