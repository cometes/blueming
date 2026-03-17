import { useEffect, useState, useRef } from "react";
import { fetchLibraryList, fetchLibraryTags } from "@/features/library/api/client";

interface LibraryItem {
	id: string;
	title: string;
	subtitle?: string;
	author?: string;
	slug?: string;
	createdAt: string;
	tags?: string[];
	thumbnail?: string;
	pinned?: boolean;
	commentCount?: number;
	allow?: "all" | "password" | "secret";
}

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

	// 중복 요청 방지를 위한 ref
	const abortControllerRef = useRef<AbortController | null>(null);
	const lastFetchParamsRef = useRef<string>("");

	// 태그 목록 로드
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

		loadTags();
	}, [initialTags]);

	// 데이터 페칭
	useEffect(() => {
		// 시리즈 탭이면 페칭하지 않음
		if (isSeriesOn) {
			return;
		}

		// 현재 요청 파라미터
		const currentParams = JSON.stringify({ page, limit, sort, tag, query });

		// 이전 요청과 동일하면 스킵
		if (currentParams === lastFetchParamsRef.current) {
			return;
		}

		// 이전 요청 취소
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

				// 요청이 취소되었으면 상태 업데이트 안 함
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

		fetchData();

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
