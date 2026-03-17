import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export const useLibraryFilters = () => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const page = Number(searchParams.get("page")) || 1;
	const sort =
		(searchParams.get("sort") as "latest" | "oldest" | "title") || "latest";
	const tag = searchParams.get("tag") || "전체";
	const query = searchParams.get("query") || "";

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
		[pathname, router, searchParams],
	);

	const setPage = useCallback(
		(newPage: number) => {
			updateURL({ page: newPage === 1 ? null : newPage });
		},
		[updateURL],
	);

	const setSort = useCallback(
		(newSort: "latest" | "oldest" | "title") => {
			updateURL({ sort: newSort === "latest" ? null : newSort, page: null });
		},
		[updateURL],
	);

	const setTag = useCallback(
		(newTag: string) => {
			updateURL({ tag: newTag, page: null, query: null });
		},
		[updateURL],
	);

	const setQuery = useCallback(
		(newQuery: string) => {
			updateURL({ query: newQuery, page: null, tag: null });
		},
		[updateURL],
	);

	const clearSearch = useCallback(() => {
		updateURL({ query: null, page: null, tag: null });
	}, [updateURL]);

	return {
		page,
		sort,
		tag,
		query,
		setPage,
		setSort,
		setTag,
		setQuery,
		clearSearch,
	};
};
