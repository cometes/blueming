import { useEffect, useRef, useState } from "react";
import { fetchLibraryList, fetchLibraryTags } from "@/features/library/api/client";

import type { LibraryItemSummary as LibraryItem } from "@/features/library/types";

interface UseLibraryListDataParams {
	initialList: LibraryItem[];
	initialPinned: LibraryItem[];
	initialTotal: number;
	initialTags?: string[];
	isSeriesOn: boolean;
	page: number;
	limit: number;
	sort: "latest" | "oldest" | "title";
	tag: string;
	query: string;
}

export const useLibraryListData = ({
	initialList,
	initialPinned,
	initialTotal,
	initialTags,
	isSeriesOn,
	page,
	limit,
	sort,
	tag,
	query,
}: UseLibraryListDataParams) => {
	const [listItems, setListItems] = useState<LibraryItem[]>(initialList);
	const [pinnedItems, setPinnedItems] = useState<LibraryItem[]>(initialPinned);
	const [listTotalCount, setListTotalCount] = useState(initialTotal);
	const [tagOptions, setTagOptions] = useState<string[]>(initialTags ?? []);
	const [isLoading, setIsLoading] = useState(false);

	const abortControllerRef = useRef<AbortController | null>(null);
	const lastFetchParamsRef = useRef<string>("");

	useEffect(() => {
		if (initialTags && initialTags.length > 0) {
			setTagOptions(initialTags);
			return;
		}

		const loadTags = async () => {
			try {
				const { data } = await fetchLibraryTags({
					useCache: true,
					staleTimeMs: 60_000,
				});
				if (Array.isArray(data)) {
					setTagOptions(data);
				}
			} catch {
				setTagOptions([]);
			}
		};

		void loadTags();
	}, [initialTags]);

	useEffect(() => {
		if (isSeriesOn) {
			return;
		}

		const currentParams = JSON.stringify({ page, limit, sort, tag, query });
		if (currentParams === lastFetchParamsRef.current) {
			return;
		}

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		const controller = new AbortController();
		abortControllerRef.current = controller;
		lastFetchParamsRef.current = currentParams;

		const fetchData = async () => {
			setIsLoading(true);

			try {
				const { data } = await fetchLibraryList({
					page,
					limit,
					sort,
					tag: tag === "전체" ? undefined : tag,
					query: query || undefined,
				});

				if (controller.signal.aborted) {
					return;
				}

				setListItems(Array.isArray(data?.items) ? data.items : []);
				setPinnedItems(Array.isArray(data?.pinnedItems) ? data.pinnedItems : []);
				setListTotalCount(typeof data?.total === "number" ? data.total : 0);
			} catch {
				if (controller.signal.aborted) {
					return;
				}
				setListItems([]);
				setPinnedItems([]);
				setListTotalCount(0);
			} finally {
				if (!controller.signal.aborted) {
					setIsLoading(false);
				}
			}
		};

		void fetchData();

		return () => {
			controller.abort();
		};
	}, [isSeriesOn, page, limit, sort, tag, query]);

	return {
		listItems,
		pinnedItems,
		listTotalCount,
		tagOptions,
		isLoading,
	};
};
