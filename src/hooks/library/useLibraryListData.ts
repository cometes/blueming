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

type ListParams = {
	page: number;
	limit: number;
	sort: "latest" | "oldest" | "title";
	tag?: string;
	query?: string;
};

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
	enablePrefetch?: boolean;
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
	enablePrefetch = false,
}: UseLibraryListDataParams) => {
	const [listItems, setListItems] = useState<LibraryItem[]>(initialList);
	const [pinnedItems, setPinnedItems] = useState<LibraryItem[]>(initialPinned);
	const [listTotalCount, setListTotalCount] = useState(initialTotal);
	const [tagOptions, setTagOptions] = useState<string[]>(initialTags ?? []);
	const [isListReady, setIsListReady] = useState(true);
	const requestIdRef = useRef(0);
	const initialParamsRef = useRef<ListParams>({
		page: listPage,
		limit: postsPerPage,
		sort: sortOrder,
		tag: activeTag === "전체" ? undefined : activeTag,
		query: appliedQuery || undefined,
	});
	const initialFetchDoneRef = useRef(false);

	useEffect(() => {
		setListItems(initialList);
		setPinnedItems(initialPinned);
		setListTotalCount(initialTotal);
		setIsListReady(true);
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

	const buildListParams = (): ListParams => ({
		page: listPage,
		limit: postsPerPage,
		sort: sortOrder,
		tag: activeTag === "전체" ? undefined : activeTag,
		query: appliedQuery || undefined,
	});

	const listParams = useMemo(
		() => buildListParams(),
		[listPage, postsPerPage, sortOrder, activeTag, appliedQuery]
	);

	const areParamsEqual = (a: ListParams, b: ListParams) =>
		a.page === b.page &&
		a.limit === b.limit &&
		a.sort === b.sort &&
		a.tag === b.tag &&
		a.query === b.query;

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

	useEffect(() => {
		if (isSeriesOn) {
			return;
		}

		const fetchPage = async () => {
			const shouldSkipInitialFetch =
				!initialFetchDoneRef.current &&
				initialParamsRef.current &&
				areParamsEqual(listParams, initialParamsRef.current);
			if (shouldSkipInitialFetch) {
				initialFetchDoneRef.current = true;
				return;
			}

			setIsListReady(false);
			try {
				const data = await refreshList();
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
				initialFetchDoneRef.current = true;
				setIsListReady(true);
			}
		};

		fetchPage();
	}, [isSeriesOn, refreshList, listPage, postsPerPage, setListPage]);

	useEffect(() => {
		if (!enablePrefetch) {
			return;
		}
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
		enablePrefetch,
	]);

	return {
		listItems,
		pinnedItems,
		listTotalCount,
		tagOptions,
		isListReady,
	};
};
