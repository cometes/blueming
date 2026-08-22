"use client";

import { useCallback, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import LibrarySettingsDialog from "@/features/library/components/LibrarySettingsDialog";
import { useLibraryFilters } from "@/features/library/hooks/useLibraryFilters";
import { useLibraryListData } from "@/features/library/hooks/useLibraryListData";
import { useLibraryPageSettings } from "@/features/library/hooks/useLibraryPageSettings";
import { useLibraryViewState } from "@/features/library/hooks/useLibraryViewState";
import { useLibraryListPaging } from "@/features/library/hooks/useLibraryListPaging";
import LibraryToolbar from "./LibraryToolbar";
import LibraryTabs from "./LibraryTabs";
import LibraryListView from "./LibraryListView";
import LibrarySeriesView from "./LibrarySeriesView";

import type { LibraryItemSummary } from "@/features/library/types";

// 목록 아이템 타입은 features/library/types.ts의 LibraryItemSummary가 단일 소스
export type LibraryItem = LibraryItemSummary;

interface LibraryClientProps {
	listData: LibraryItem[];
	pinnedData: LibraryItem[];
	listTotal: number;
	seriesData: LibraryItem[];
	tagData?: string[];
	initialIsCardOn?: boolean;
}

export default function LibraryClient({
	listData,
	pinnedData,
	listTotal,
	seriesData,
	tagData,
	initialIsCardOn,
}: LibraryClientProps) {
	const { onClickMoveToPage } = useMoveToPage();
	const { isAdmin, isManagerOrAdmin, isAuthenticated } = useAdmin();
	const { isSeriesOn, isCardOn, selectTab, selectView } =
		useLibraryViewState(initialIsCardOn);
	const settings = useLibraryPageSettings();

	// 검색어 입력 상태 (실제 검색은 엔터 시)
	const [searchInputValue, setSearchInputValue] = useState("");

	// URL 기반 필터 (단일 진실 소스)
	const filters = useLibraryFilters();

	// 데이터 페칭
	const { listItems, pinnedItems, listTotalCount, tagOptions, isLoading } =
		useLibraryListData({
			initialList: listData,
			initialPinned: pinnedData,
			initialTotal: listTotal,
			initialTags: tagData,
			isSeriesOn,
			page: filters.page,
			limit: settings.postsPerPage,
			sort: filters.sort,
			tag: filters.tag,
			query: filters.query,
		});

	const { totalPages, currentPageSafe, pagedSeriesData, detailQuery } =
		useLibraryListPaging({
			seriesData,
			isSeriesOn,
			listTotalCount,
			postsPerPage: settings.postsPerPage,
			page: filters.page,
			sort: filters.sort,
		});

	const handlePageChange = useCallback(
		(page: number) => {
			filters.setPage(page);
			window.scrollTo({ top: 0, behavior: "smooth" });
		},
		[filters],
	);

	const handleTagSelect = useCallback(
		(tag: string) => {
			filters.setTag(tag);
			setSearchInputValue("");
		},
		[filters],
	);

	const canWrite =
		settings.writePermission === "admin"
			? isAdmin
			: settings.writePermission === "manager"
				? isManagerOrAdmin
				: isAuthenticated;

	return (
		<div className="w-full max-w-full md:max-w-2xl mt-[90px] mb-[40px] mx-auto md:px-0">
			<LibraryToolbar
				isCardOn={isCardOn}
				onSelectView={selectView}
				searchValue={searchInputValue}
				onSearchValueChange={setSearchInputValue}
				onSubmitSearch={() => filters.setQuery(searchInputValue.trim())}
				onClearSearch={() => {
					setSearchInputValue("");
					filters.clearSearch();
				}}
				canWrite={canWrite}
				onWrite={onClickMoveToPage("/library/new/")}
				settingsSlot={
					isAdmin ? (
						<LibrarySettingsDialog
							isOpen={settings.isDialogOpen}
							onOpenChange={settings.setIsDialogOpen}
							tempLayoutType={settings.tempLayoutType}
							setTempLayoutType={settings.setTempLayoutType}
							tempPostsPerPage={settings.tempPostsPerPage}
							setTempPostsPerPage={settings.setTempPostsPerPage}
							tempPostsPerRow={settings.tempPostsPerRow}
							setTempPostsPerRow={settings.setTempPostsPerRow}
							tempWritePermission={settings.tempWritePermission}
							setTempWritePermission={settings.setTempWritePermission}
							onSave={settings.handleSaveSettings}
							trigger={
								<Button
									className="bg-card border-card text-main-text rounded-full w-10 h-10 hover:border-transparent"
									style={{
										transition:
											"background-color 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out",
									}}
								>
									<Settings />
								</Button>
							}
						/>
					) : undefined
				}
			/>
			<LibraryTabs isSeriesOn={isSeriesOn} onSelect={selectTab} />
			{isSeriesOn ? (
				<LibrarySeriesView
					postsPerRow={settings.postsPerRow}
					seriesItems={pagedSeriesData}
				/>
			) : (
				<LibraryListView
					listItems={listItems}
					pinnedItems={pinnedItems}
					listTotalCount={listTotalCount}
					isLoading={isLoading}
					isCardOn={isCardOn}
					layoutType={settings.layoutType}
					postsPerRow={settings.postsPerRow}
					tagOptions={tagOptions}
					activeTag={filters.tag}
					setActiveTag={handleTagSelect}
					sortOrder={filters.sort}
					setSortOrder={filters.setSort}
					onClickMoveToPage={onClickMoveToPage}
					detailQuery={detailQuery}
					totalPages={totalPages}
					currentPageSafe={currentPageSafe}
					setActivePage={handlePageChange}
				/>
			)}
		</div>
	);
}
