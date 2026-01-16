import { useEffect, useState } from "react";

interface UseLibraryFiltersParams {
	isSeriesOn: boolean;
	postsPerPage: number;
}

export const useLibraryFilters = ({
	isSeriesOn,
	postsPerPage,
}: UseLibraryFiltersParams) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [appliedQuery, setAppliedQuery] = useState("");
	const [activeTag, setActiveTag] = useState<string>("전체");
	const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "title">(
		"latest"
	);
	const [listPage, setListPage] = useState(1);
	const [seriesPage, setSeriesPage] = useState(1);

	const setActivePage = (page: number) => {
		if (isSeriesOn) {
			setSeriesPage(page);
		} else {
			setListPage(page);
		}
	};

	useEffect(() => {
		setListPage(1);
	}, [sortOrder, appliedQuery, activeTag, postsPerPage]);

	useEffect(() => {
		setSeriesPage(1);
	}, [sortOrder, postsPerPage]);

	return {
		searchQuery,
		setSearchQuery,
		appliedQuery,
		setAppliedQuery,
		activeTag,
		setActiveTag,
		sortOrder,
		setSortOrder,
		listPage,
		seriesPage,
		setListPage,
		setSeriesPage,
		setActivePage,
	};
};
