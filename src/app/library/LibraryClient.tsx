"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Settings, X } from "lucide-react";
import AdminOnly from "@/components/common/AdminOnly";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import LibrarySettingsDialog from "@/components/modal/LibrarySettingsDialog";
import { setSettingsLibrary } from "@/queries/set/setSettingsLibrary";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { useLibraryFilters } from "@/hooks/library/useLibraryFilters";
import { useLibraryListData } from "@/hooks/library/useLibraryListData";
import LibraryListView from "./LibraryListView";
import LibrarySeriesView from "./LibrarySeriesView";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

interface LibraryClientProps {
	listData: LibraryItem[];
	pinnedData: LibraryItem[];
	listTotal: number;
	seriesData: LibraryItem[];
	tagData?: string[];
}

export default function LibraryClient({
	listData,
	pinnedData,
	listTotal,
	seriesData,
	tagData,
}: LibraryClientProps) {
	const { library, updateLibrary, refreshSettings } = useSettings();
	const [isSeriesOn, setIsSeriesOn] = useState(false);
	const [isCardOn, setIsCardOn] = useState(false);
	const { onClickMoveToPage } = useMoveToPage();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isCardPrefsLoaded, setIsCardPrefsLoaded] = useState(false);
	const isSyncingFromQuery = useRef(false);

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
		resolvedLibrarySettings.postsPerRow,
	);
	const [writePermission, setWritePermission] = useState<"admin" | "member">(
		resolvedLibrarySettings.writePermission,
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const {
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
		setActivePage,
	} = useLibraryFilters({ isSeriesOn, postsPerPage });
	const { listItems, pinnedItems, listTotalCount, tagOptions, isListReady } =
		useLibraryListData({
			initialList: listData,
			initialPinned: pinnedData,
			initialTotal: listTotal,
			initialTags: tagData,
			isSeriesOn,
			listPage,
			postsPerPage,
			sortOrder,
			activeTag,
			appliedQuery,
			setListPage,
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

	const updatePageParam = (nextPage: number) => {
		const params = new URLSearchParams(searchParams.toString());
		if (nextPage > 1) {
			params.set("page", String(nextPage));
		} else {
			params.delete("page");
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

	// 로컬 스토리지에서 카드 뷰 상태 불러오기
	useEffect(() => {
		const savedIsCardOn = localStorage.getItem("isCardOn");

		if (savedIsCardOn !== null) {
			setIsCardOn(savedIsCardOn === "true");
		}
		setIsCardPrefsLoaded(true);
	}, []);

	// 카드 뷰 상태 변경 시 로컬 스토리지에 저장
	useEffect(() => {
		if (!isCardPrefsLoaded) {
			return;
		}
		localStorage.setItem("isCardOn", isCardOn.toString());
	}, [isCardOn, isCardPrefsLoaded]);

	useEffect(() => {
		setLayoutType(resolvedLibrarySettings.layoutType);
		setPostsPerPage(resolvedLibrarySettings.postsPerPage);
		setPostsPerRow(resolvedLibrarySettings.postsPerRow);
		setWritePermission(resolvedLibrarySettings.writePermission);
	}, [resolvedLibrarySettings]);

	useEffect(() => {
		if (isSeriesOn) return;
		const pageParam = searchParams.get("page");
		const parsedPage = pageParam ? Number(pageParam) : 1;
		if (
			Number.isFinite(parsedPage) &&
			parsedPage > 0 &&
			parsedPage !== listPage
		) {
			isSyncingFromQuery.current = true;
			setListPage(parsedPage);
		}
	}, [isSeriesOn, searchParams, setListPage]);

	useEffect(() => {
		if (isSeriesOn) return;
		if (isSyncingFromQuery.current) {
			isSyncingFromQuery.current = false;
			return;
		}
		const pageParam = searchParams.get("page");
		const parsedPage = pageParam ? Number(pageParam) : 1;
		if (parsedPage !== listPage) {
			updatePageParam(listPage);
		}
	}, [isSeriesOn, listPage, pathname, router, searchParams]);

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
				postsPerRow: tempPostsPerRow,
				writePermission: tempWritePermission,
			};
			const response = await setSettingsLibrary(payload);
			setLayoutType(response.library.layoutType);
			setPostsPerPage(response.library.postsPerPage);
			setPostsPerRow(response.library.postsPerRow);
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
			if (sortOrder === "title") {
				return (a.title || "").localeCompare(b.title || "");
			}
			const aTime = new Date(a.createdAt).getTime();
			const bTime = new Date(b.createdAt).getTime();
			return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
		});
		return sorted;
	}, [seriesData, sortOrder]);

	const { totalPages, currentPageSafe, pagedSeriesData } = useMemo(() => {
		const totalItems = isSeriesOn ? filteredSeriesData.length : listTotalCount;
		const nextTotalPages = Math.max(1, Math.ceil(totalItems / postsPerPage));
		const activePage = isSeriesOn ? seriesPage : listPage;
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
		listPage,
		seriesPage,
		listTotalCount,
		pinnedItems.length,
		postsPerPage,
	]);

	const detailQuery = useMemo(() => {
		return currentPageSafe > 1 ? `?page=${currentPageSafe}` : "";
	}, [currentPageSafe]);

	return (
		<>
			<div
				className={cn(
					"shrink-0 w-full   max-w-3xl mt-[90px] mb-[40px]",
					isSeriesOn ? "" : "",
				)}
			>
				<div className="flex justify-center items-center gap-2.5">
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
					<div className="flex items-center w-fit h-full sm:w-[200px]">
						<Input
							className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							endIcon={searchQuery ? X : Search}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="제목, 태그로 검색"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									setAppliedQuery(searchQuery.trim());
								}
							}}
							onEndIconClick={
								searchQuery
									? () => {
											setSearchQuery("");
											setAppliedQuery("");
											setActiveTag("전체");
											setListPage(1);
										}
									: undefined
							}
							endIconAriaLabel="검색어 지우기"
						/>
					</div>
					<AdminOnly>
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
								<Button className="bg-card border-card text-main-text rounded-full w-10 h-10 hover:border-transparent">
									<Settings />
								</Button>
							}
						/>
					</AdminOnly>
					{writePermission === "admin" ? (
						<AdminOnly>
							<Button
								onClick={onClickMoveToPage("/library/new/")}
								className="bg-theme-primary hover:bg-theme-primary/90"
							>
								<Plus size={14} />새 글쓰기
							</Button>
						</AdminOnly>
					) : (
						<Button
							onClick={onClickMoveToPage("/library/new/")}
							className="bg-theme-primary hover:bg-theme-primary/90"
						>
							<Plus size={14} />새 글쓰기
						</Button>
					)}
				</div>
				<div className="TabWrap w-fit mx-auto mt-7">
					<div className="TabBox flex justify-center">
						<button
							className={cn(
								"Tab block font-medium text-sub-text bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer",
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
								"Tab block font-medium text-sub-text bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer",
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
						isListReady={isListReady}
						isCardOn={isCardOn}
						layoutType={layoutType}
						postsPerRow={postsPerRow}
						tagOptions={tagOptions}
						activeTag={activeTag}
						setActiveTag={setActiveTag}
						sortOrder={sortOrder}
						setSortOrder={setSortOrder}
						onClickMoveToPage={onClickMoveToPage}
						detailQuery={detailQuery}
						totalPages={totalPages}
						currentPageSafe={currentPageSafe}
						setActivePage={setActivePage}
					/>
				)}
			</div>
		</>
	);
}
