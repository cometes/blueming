"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Settings, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import LibrarySettingsDialog from "@/features/library/components/LibrarySettingsDialog";
import { setSettingsLibrary } from "@/features/settings/api/client";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { useLibraryFilters } from "@/features/library/hooks/useLibraryFilters";
import { useLibraryListData } from "@/features/library/hooks/useLibraryListData";
import LibraryListView from "./LibraryListView";
import LibrarySeriesView from "./LibrarySeriesView";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

const clampLibraryPostsPerRow = (value: number) =>
	Math.min(Math.max(Math.floor(value), 1), 5);

export default function LibraryClient({
	listData,
	pinnedData,
	listTotal,
	seriesData,
	tagData,
	initialIsCardOn,
}: LibraryClientProps) {
	const { library, updateLibrary, refreshSettings } = useSettings();
	const [isSeriesOn, setIsSeriesOn] = useState(false);
	const [isCardOn, setIsCardOn] = useState(initialIsCardOn ?? false);
	const { onClickMoveToPage } = useMoveToPage();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isCardPrefsLoaded] = useState(true);
	const { isAdmin, isManagerOrAdmin, isAuthenticated } = useAdmin();

	const defaultLibrarySettings = useMemo(
		() => ({
			layoutType: "listWithImage" as const,
			postsPerPage: 10,
			postsPerRow: 3,
			writePermission: "admin" as const,
		}),
		[],
	);

	const resolvedLibrarySettings = useMemo(
		() => ({
			...defaultLibrarySettings,
			...(library || {}),
		}),
		[defaultLibrarySettings, library],
	);

	// 페이지 설정 상태
	const [layoutType, setLayoutType] = useState<"list" | "listWithImage">(
		resolvedLibrarySettings.layoutType,
	);
	const [postsPerPage, setPostsPerPage] = useState(
		resolvedLibrarySettings.postsPerPage,
	);
	const [postsPerRow, setPostsPerRow] = useState(
		clampLibraryPostsPerRow(resolvedLibrarySettings.postsPerRow),
	);
	const [writePermission, setWritePermission] = useState<
		"admin" | "manager" | "member"
	>(
		resolvedLibrarySettings.writePermission,
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

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
			limit: postsPerPage,
			sort: filters.sort,
			tag: filters.tag,
			query: filters.query,
		});

	// Dialog 임시 상태 (저장 전까지 사용)
	const [tempLayoutType, setTempLayoutType] = useState(layoutType);
	const [tempPostsPerPage, setTempPostsPerPage] = useState(postsPerPage);
	const [tempPostsPerRow, setTempPostsPerRow] = useState(postsPerRow);
	const [tempWritePermission, setTempWritePermission] =
		useState(writePermission);

	const updateTabParam = (nextIsSeriesOn: boolean) => {
		const params = new URLSearchParams(searchParams.toString());
		if (nextIsSeriesOn) {
			params.set("tab", "series");
		} else {
			params.delete("tab");
		}
		const query = params.toString();
		router.replace(query ? `${pathname}?${query}` : pathname, {
			scroll: false,
		});
	};

	// URL 쿼리에서 탭 상태 복원
	useEffect(() => {
		const tab = searchParams.get("tab");
		setIsSeriesOn(tab === "series");
	}, [searchParams]);

	// 카드 뷰 상태 변경 시 로컬 스토리지에 저장
	useEffect(() => {
		if (!isCardPrefsLoaded) {
			return;
		}
		document.cookie = `library_card_on=${isCardOn}; path=/; max-age=31536000`;
	}, [isCardOn, isCardPrefsLoaded]);

	useEffect(() => {
		setLayoutType(resolvedLibrarySettings.layoutType);
		setPostsPerPage(resolvedLibrarySettings.postsPerPage);
		setPostsPerRow(clampLibraryPostsPerRow(resolvedLibrarySettings.postsPerRow));
		setWritePermission(resolvedLibrarySettings.writePermission);
	}, [resolvedLibrarySettings]);

	const handlePageChange = useCallback(
		(page: number) => {
			filters.setPage(page);
			window.scrollTo({ top: 0, behavior: "smooth" });
		},
		[filters],
	);

	// Dialog가 열릴 때 현재 설정값으로 임시 상태 초기화
	useEffect(() => {
		if (isDialogOpen) {
			setTempLayoutType(layoutType);
			setTempPostsPerPage(postsPerPage);
			setTempPostsPerRow(postsPerRow);
			setTempWritePermission(writePermission);
		}
	}, [isDialogOpen, layoutType, postsPerPage, postsPerRow, writePermission]);

	// 설정 저장 핸들러
	const handleSaveSettings = async () => {
		try {
			const payload = {
				layoutType: tempLayoutType,
				postsPerPage: tempPostsPerPage,
				postsPerRow: clampLibraryPostsPerRow(tempPostsPerRow),
				writePermission: tempWritePermission,
			};
			const response = await setSettingsLibrary(payload);
			setLayoutType(response.library.layoutType);
			setPostsPerPage(response.library.postsPerPage);
			setPostsPerRow(clampLibraryPostsPerRow(response.library.postsPerRow));
			setWritePermission(response.library.writePermission);
			updateLibrary?.(response.library);
			await refreshSettings?.({ broadcast: true });
			setIsDialogOpen(false);
			toast.success("저장되었습니다.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "저장에 실패했습니다.";
			toast.error(message);
		}
	};

	const filteredSeriesData = useMemo(() => {
		const sorted = [...seriesData].sort((a, b) => {
			if (filters.sort === "title") {
				return (a.title || "").localeCompare(b.title || "");
			}
			const aTime = new Date(a.createdAt).getTime();
			const bTime = new Date(b.createdAt).getTime();
			return filters.sort === "latest" ? bTime - aTime : aTime - bTime;
		});
		return sorted;
	}, [seriesData, filters.sort]);

	const { totalPages, currentPageSafe, pagedSeriesData } = useMemo(() => {
		const totalItems = isSeriesOn ? filteredSeriesData.length : listTotalCount;
		const nextTotalPages = Math.max(1, Math.ceil(totalItems / postsPerPage));
		const activePage = filters.page;
		const nextCurrentPage = Math.min(activePage, nextTotalPages);
		const startIndex = (nextCurrentPage - 1) * postsPerPage;
		return {
			totalPages: nextTotalPages,
			currentPageSafe: nextCurrentPage,
			pagedSeriesData: filteredSeriesData.slice(
				startIndex,
				startIndex + postsPerPage,
			),
		};
	}, [
		filteredSeriesData,
		isSeriesOn,
		filters.page,
		listTotalCount,
		postsPerPage,
	]);

	const detailQuery = useMemo(() => {
		return currentPageSafe > 1 ? `?page=${currentPageSafe}` : "";
	}, [currentPageSafe]);

	const handleTagSelect = useCallback(
		(tag: string) => {
			filters.setTag(tag);
			setSearchInputValue("");
		},
		[filters],
	);

	const canWrite =
		writePermission === "admin"
			? isAdmin
			: writePermission === "manager"
				? isManagerOrAdmin
				: isAuthenticated;
	const showSettingsButton = isAdmin;
	const hasRightButtons = showSettingsButton || canWrite;

	return (
		<>
			<div className="w-full max-w-full md:max-w-2xl mt-[90px] mb-[40px] mx-auto md:px-0">
				<div className="flex justify-center items-center gap-2.5">
					<div className="flex items-center justify-end sm:w-[150px]">
						<div className="relative flex rounded-card bg-transparent p-1">
							<div
								className={cn(
									"absolute top-1 w-10 h-10 rounded-card bg-card border border-card transition-all duration-300 ease-in-out shadow-sm",
									isCardOn ? "translate-x-10" : "translate-x-0",
								)}
							/>
							<button
								className="relative z-10 w-10 h-10 rounded-card p-2.5 cursor-pointer flex flex-col justify-between transition-colors duration-300"
								onClick={() => {
									setIsCardOn(false);
									setIsSeriesOn(false);
									updateTabParam(false);
								}}
							>
								<span className="w-full h-[3px] rounded-[1px] bg-[#dee2e6]" />
								<span className="w-full h-[3px] rounded-[1px] bg-[#dee2e6]" />
								<span className="w-full h-[3px] rounded-[1px] bg-[#dee2e6]" />
							</button>
							<button
								className="relative z-10 w-10 h-10 rounded-card p-2.5 cursor-pointer grid grid-cols-2 gap-0.5 transition-colors duration-300"
								onClick={() => {
									setIsCardOn(true);
									setIsSeriesOn(false);
									updateTabParam(false);
								}}
							>
								<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
								<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
								<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
								<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
							</button>
						</div>
					</div>
					<div className="flex items-center w-fit h-full">
						<Input
							className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							endIcon={searchInputValue ? X : Search}
							value={searchInputValue}
							onChange={(e) => setSearchInputValue(e.target.value)}
							placeholder="제목, 태그로 검색"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									filters.setQuery(searchInputValue.trim());
								}
							}}
							onEndIconClick={
								searchInputValue
									? () => {
											setSearchInputValue("");
											filters.clearSearch();
										}
									: undefined
							}
							endIconAriaLabel="검색어 지우기"
						/>
					</div>
					{showSettingsButton ? (
						<LibrarySettingsDialog
							isOpen={isDialogOpen}
							onOpenChange={setIsDialogOpen}
							tempLayoutType={tempLayoutType}
							setTempLayoutType={setTempLayoutType}
							tempPostsPerPage={tempPostsPerPage}
							setTempPostsPerPage={setTempPostsPerPage}
							tempPostsPerRow={tempPostsPerRow}
							setTempPostsPerRow={setTempPostsPerRow}
							tempWritePermission={tempWritePermission}
							setTempWritePermission={setTempWritePermission}
							onSave={handleSaveSettings}
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
					) : null}
					{canWrite ? (
						<>
							<Button
								onClick={onClickMoveToPage("/library/new/")}
								className="bg-theme-primary hover:bg-theme-primary/90 hidden sm:flex"
							>
								<Plus size={14} />새 글쓰기
							</Button>
							<Button
								onClick={onClickMoveToPage("/library/new/")}
								className="w-10 h-10 bg-theme-primary hover:bg-theme-primary/90 block sm:hidden"
							>
								<Plus size={14} />
							</Button>
						</>
					) : null}
					{!hasRightButtons ? <div className="w-[90px] sm:w-[150px]" /> : null}
				</div>
				<div className="TabWrap w-fit mx-auto mt-2.5 sm:mt-7">
					<div className="TabBox flex justify-center">
						<button
							className={cn(
								"Tab block font-medium text-sub-text bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer font-title",
								isSeriesOn ? "" : "text-theme-primary",
							)}
							onClick={() => {
								setIsSeriesOn(false);
								updateTabParam(false);
							}}
						>
							글
						</button>
						<button
							className={cn(
								"Tab block font-medium text-sub-text bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer font-title",
								isSeriesOn ? "text-theme-primary" : "",
							)}
							onClick={() => {
								setIsSeriesOn(true);
								updateTabParam(true);
							}}
						>
							시리즈
						</button>
					</div>
					<div
						className={cn(
							"h-0.5 bg-sub-text relative after:absolute after:top-0 after:block after:w-1/2 after:h-0.5 after:bg-theme-primary after:transition-all after:duration-300 after:ease-in-out",
							isSeriesOn ? "after:right-0" : "after:right-1/2",
						)}
					/>
				</div>
				{isSeriesOn ? (
					<LibrarySeriesView
						postsPerRow={postsPerRow}
						seriesItems={pagedSeriesData}
					/>
				) : (
					<LibraryListView
						listItems={listItems}
						pinnedItems={pinnedItems}
						listTotalCount={listTotalCount}
						isLoading={isLoading}
						isCardOn={isCardOn}
						layoutType={layoutType}
						postsPerRow={postsPerRow}
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
		</>
	);
}
