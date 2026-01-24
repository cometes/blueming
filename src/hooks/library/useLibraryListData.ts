import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchLibraryList, fetchLibraryTags } from "@/queries/fetch/fetchLibrary";

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
	allow?: "all" | "password" | "secret";
}

interface UseLibraryListDataParams {
	initialList: LibraryItem[];
	initialPinned: LibraryItem[];
	initialTotal: number;
	initialTags?: string[];
	isSeriesOn: boolean;
	listPage: number;
	postsPerPage: number;
	sortOrder: "latest" | "oldest" | "title";
	activeTag: string;
	appliedQuery: string;
	setListPage: (page: number) => void;
}

export const useLibraryListData = ({
	initialList,
	initialPinned,
	initialTotal,
	initialTags,
	isSeriesOn,
	listPage,
	postsPerPage,
	sortOrder,
	activeTag,
	appliedQuery,
	setListPage,
}: UseLibraryListDataParams) => {
	const [listItems, setListItems] = useState<LibraryItem[]>(initialList);
	const [pinnedItems, setPinnedItems] = useState<LibraryItem[]>(initialPinned);
	const [listTotalCount, setListTotalCount] = useState(initialTotal);
	const [tagOptions, setTagOptions] = useState<string[]>(initialTags ?? []);
	// 초기 데이터가 있으면 ready, 없으면 로딩 중으로 시작
	const [isLoading, setIsLoading] = useState(
		!(initialList.length > 0 || initialPinned.length > 0)
	);
	const requestIdRef = useRef(0);

	// 초기 데이터가 있으면 즉시 ready 상태로 전환
	useEffect(() => {
		setListItems(initialList);
		setPinnedItems(initialPinned);
		setListTotalCount(initialTotal);
		// 초기 데이터가 로드되었으면 ready 상태로 변경
		if (initialList.length > 0 || initialPinned.length > 0) {
			setIsLoading(false);
		} else {
			setIsLoading(true);
		}
	}, [initialList, initialPinned, initialTotal]);

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

	const listParams = useMemo(
		() => ({
			page: listPage,
			limit: postsPerPage,
			sort: sortOrder,
			tag: activeTag === "전체" ? undefined : activeTag,
			query: appliedQuery || undefined,
		}),
		[listPage, postsPerPage, sortOrder, activeTag, appliedQuery]
	);

	const refreshList = useCallback(async () => {
		const requestId = ++requestIdRef.current;
		const { data } = await fetchLibraryList(listParams);
		if (requestId !== requestIdRef.current) {
			return data;
		}
		setListItems(Array.isArray(data?.items) ? data.items : []);
		setPinnedItems(Array.isArray(data?.pinnedItems) ? data.pinnedItems : []);
		setListTotalCount(typeof data?.total === "number" ? data.total : 0);
		return data;
	}, [listParams]);

	const applyPinOptimistic = useCallback(
		(id: string, nextPinned: boolean) => {
			const listSnapshot = listItems;
			const pinnedSnapshot = pinnedItems;

			const findItem = () =>
				listSnapshot.find((item) => item.id === id) ??
				pinnedSnapshot.find((item) => item.id === id);

			const target = findItem();
			if (!target) {
				return () => undefined;
			}

			const nextItem = { ...target, pinned: nextPinned };

			if (nextPinned) {
				setPinnedItems((prev) => {
					if (prev.some((item) => item.id === id)) {
						return prev.map((item) =>
							item.id === id ? nextItem : item
						);
					}
					return [nextItem, ...prev];
				});
				setListItems((prev) => prev.filter((item) => item.id !== id));
			} else {
				setPinnedItems((prev) => prev.filter((item) => item.id !== id));
				setListItems((prev) => {
					if (prev.some((item) => item.id === id)) {
						return prev.map((item) =>
							item.id === id ? nextItem : item
						);
					}
					return [nextItem, ...prev];
				});
			}

			return () => {
				setListItems(listSnapshot);
				setPinnedItems(pinnedSnapshot);
			};
		},
		[listItems, pinnedItems]
	);

	useEffect(() => {
		if (isSeriesOn) {
			return;
		}

		const fetchPage = async () => {
			setIsLoading(true);
			try {
				const requestId = ++requestIdRef.current;
				const { data } = await fetchLibraryList(listParams);

				// 요청이 취소되었는지 확인
				if (requestId !== requestIdRef.current) {
					return;
				}

				setListItems(Array.isArray(data?.items) ? data.items : []);
				setPinnedItems(Array.isArray(data?.pinnedItems) ? data.pinnedItems : []);
				setListTotalCount(typeof data?.total === "number" ? data.total : 0);

				const nextTotalPages = Math.max(
					1,
					Math.ceil((data?.total || 0) / postsPerPage)
				);
				if (listPage > nextTotalPages) {
					setListPage(nextTotalPages);
				}
			} catch {
				setListItems([]);
				setListTotalCount(0);
		} finally {
			setIsLoading(false);
		}
	};

		fetchPage();
	}, [isSeriesOn, listParams, listPage, postsPerPage, setListPage]);

	useEffect(() => {
		if (isSeriesOn) {
			return;
		}

		const totalPages = Math.max(1, Math.ceil(listTotalCount / postsPerPage));
		if (listPage >= totalPages) {
			return;
		}

		const nextPage = listPage + 1;
		fetchLibraryList(
			{
				page: nextPage,
				limit: postsPerPage,
				sort: sortOrder,
				tag: activeTag === "전체" ? undefined : activeTag,
				query: appliedQuery || undefined,
			},
			{ useCache: true, staleTimeMs: 60_000 }
		);
	}, [
		isSeriesOn,
		listPage,
		listTotalCount,
		postsPerPage,
		sortOrder,
		activeTag,
		appliedQuery,
	]);

	return {
		listItems,
		pinnedItems,
		listTotalCount,
		tagOptions,
		isLoading,
		refreshList,
		applyPinOptimistic,
	};
};
