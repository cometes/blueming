"use client";

import { useEffect, useMemo, useState } from "react";
import ItemCard from "@/components/items/Card";
import ItemGallery from "@/components/items/Gallery";
import { Plus, Search, Settings, X, ArrowUpDown } from "lucide-react";
import AdminOnly from "@/components/common/AdminOnly";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import ItemListWithImage from "@/components/items/ListWithImage";
import ItemList from "@/components/items/List";
import LibrarySettingsDialog from "@/components/modal/LibrarySettingsDialog";
import { setSettingsLibrary } from "@/queries/set/setSettingsLibrary";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { fetchLibraryList, fetchLibraryTags } from "@/queries/fetch/fetchLibrary";

interface LibraryItem {
	id: string;
	title: string;
	subtitle?: string;
	slug?: string;
	createdAt: string;
	tags?: string[];
	thumbnail?: string;
}

interface LibraryClientProps {
	listData: LibraryItem[];
	listTotal: number;
	seriesData: LibraryItem[];
}

export default function LibraryClient({
	listData,
	listTotal,
	seriesData,
}: LibraryClientProps) {
	const { library, updateLibrary, refreshSettings } = useSettings();
	const [isSeriesOn, setIsSeriesOn] = useState(false);
	const [isCardOn, setIsCardOn] = useState(false);
	const [segmentedValue, setSegmentedValue] = useState("row");
	const { onClickMoveToPage } = useMoveToPage();
	const [searchQuery, setSearchQuery] = useState("");
	const [appliedQuery, setAppliedQuery] = useState("");
	const [activeTag, setActiveTag] = useState<string>("전체");
	const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "title">(
		"latest"
	);
	const [listPage, setListPage] = useState(1);
	const [seriesPage, setSeriesPage] = useState(1);
	const [listItems, setListItems] = useState<LibraryItem[]>(listData);
	const [listTotalCount, setListTotalCount] = useState(listTotal);
	const [tagOptions, setTagOptions] = useState<string[]>([]);
	const [isListReady, setIsListReady] = useState(true);
	const setActivePage = (page: number) => {
		if (isSeriesOn) {
			setSeriesPage(page);
		} else {
			setListPage(page);
		}
	};

	const defaultLibrarySettings = useMemo(
		() => ({
			layoutType: "listWithImage" as const,
			postsPerPage: 10,
			postsPerRow: 3,
			writePermission: "admin" as const,
		}),
		[]
	);

	const resolvedLibrarySettings = useMemo(
		() => ({
			...defaultLibrarySettings,
			...(library || {}),
		}),
		[defaultLibrarySettings, library]
	);

	// 페이지 설정 상태
	const [layoutType, setLayoutType] = useState<"list" | "listWithImage">(
		resolvedLibrarySettings.layoutType
	);
	const [postsPerPage, setPostsPerPage] = useState(
		resolvedLibrarySettings.postsPerPage
	);
	const [postsPerRow, setPostsPerRow] = useState(
		resolvedLibrarySettings.postsPerRow
	);
	const [writePermission, setWritePermission] = useState<"admin" | "member">(
		resolvedLibrarySettings.writePermission
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Dialog 임시 상태 (저장 전까지 사용)
	const [tempLayoutType, setTempLayoutType] = useState(layoutType);
	const [tempPostsPerPage, setTempPostsPerPage] = useState(postsPerPage);
	const [tempPostsPerRow, setTempPostsPerRow] = useState(postsPerRow);
	const [tempWritePermission, setTempWritePermission] =
		useState(writePermission);

	// 로컬 스토리지에서 상태 불러오기
	useEffect(() => {
		const savedIsSeriesOn = localStorage.getItem("isSeriesOn");
		const savedIsCardOn = localStorage.getItem("isCardOn");
		const savedSegmentedValue = localStorage.getItem("segmentedValue");

		if (savedIsSeriesOn !== null) {
			setIsSeriesOn(savedIsSeriesOn === "true");
		}
		if (savedIsCardOn !== null) {
			setIsCardOn(savedIsCardOn === "true");
		}
		if (savedSegmentedValue !== null) {
			setSegmentedValue(savedSegmentedValue);
		} else if (savedIsCardOn === "true") {
			setSegmentedValue("gallery");
		}
	}, []);

	// 상태 변경 시 로컬 스토리지에 저장
	useEffect(() => {
		localStorage.setItem("isSeriesOn", isSeriesOn.toString());
		localStorage.setItem("isCardOn", isCardOn.toString());
		localStorage.setItem("segmentedValue", segmentedValue);
	}, [
		isSeriesOn,
		isCardOn,
		segmentedValue,
	]);

	useEffect(() => {
		setLayoutType(resolvedLibrarySettings.layoutType);
		setPostsPerPage(resolvedLibrarySettings.postsPerPage);
		setPostsPerRow(resolvedLibrarySettings.postsPerRow);
		setWritePermission(resolvedLibrarySettings.writePermission);
	}, [resolvedLibrarySettings]);

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

	useEffect(() => {
		setListItems(listData);
		setListTotalCount(listTotal);
		setIsListReady(true);
	}, [listData, listTotal]);

	useEffect(() => {
		const loadTags = async () => {
			try {
				const { data } = await fetchLibraryTags();
				if (Array.isArray(data)) {
					setTagOptions(data);
				}
			} catch {
				setTagOptions([]);
			}
		};
		loadTags();
	}, []);

	const filteredSeriesData = useMemo(() => {
		const sorted = [...seriesData].sort((a, b) => {
			if (sortOrder === "title") {
				return a.title.localeCompare(b.title);
			}
			const aTime = new Date(a.createdAt).getTime();
			const bTime = new Date(b.createdAt).getTime();
			return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
		});
		return sorted;
	}, [seriesData, sortOrder]);

	const totalItems = isSeriesOn ? filteredSeriesData.length : listTotalCount;
	const totalPages = Math.max(1, Math.ceil(totalItems / postsPerPage));
	const activePage = isSeriesOn ? seriesPage : listPage;
	const currentPageSafe = Math.min(activePage, totalPages);
	const startIndex = (currentPageSafe - 1) * postsPerPage;
	const pagedListData = listItems;
	const pagedSeriesData = filteredSeriesData.slice(
		startIndex,
		startIndex + postsPerPage
	);

useEffect(() => {
	setListPage(1);
}, [sortOrder, appliedQuery, activeTag, postsPerPage]);

useEffect(() => {
	setSeriesPage(1);
}, [sortOrder, postsPerPage]);

	useEffect(() => {
		if (isSeriesOn) {
			return;
		}

		const fetchPage = async () => {
			setIsListReady(false);
			try {
				const { data } = await fetchLibraryList({
					page: listPage,
					limit: postsPerPage,
					sort: sortOrder,
					tag: activeTag === "전체" ? undefined : activeTag,
					query: appliedQuery || undefined,
				});
				setListItems(Array.isArray(data?.items) ? data.items : []);
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
				setIsListReady(true);
			}
		};

		fetchPage();
	}, [isSeriesOn, listPage, postsPerPage, sortOrder, activeTag, appliedQuery]);

	useEffect(() => {
		if (isSeriesOn) {
			return;
		}

		if (currentPageSafe >= totalPages) {
			return;
		}

		const nextPage = currentPageSafe + 1;
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
		currentPageSafe,
		totalPages,
		postsPerPage,
		sortOrder,
		activeTag,
		appliedQuery,
	]);

	return (
		<>
			<div
				className={cn(
					"shrink-0 w-full   max-w-3xl mt-[90px] mb-[40px]",
					isSeriesOn ? "" : ""
				)}
			>
				<div className="flex justify-center items-center gap-2.5">
					<div className="relative flex rounded-card bg-transparent p-1">
						<div
							className={cn(
								"absolute top-1 w-10 h-10 rounded-card bg-card border border-card transition-all duration-300 ease-in-out shadow-sm",
								isCardOn ? "translate-x-10" : "translate-x-0"
							)}
						/>
						<button
							className="relative z-10 w-10 h-10 rounded-card p-2.5 cursor-pointer flex flex-col justify-between transition-colors duration-300"
							onClick={() => {
								setIsCardOn(false);
								setIsSeriesOn(false);
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
							}}
						>
							<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
							<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
							<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
							<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
						</button>
					</div>
					<div className="flex items-center w-fit h-full">
						<Input
							className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							endIcon={searchQuery ? X : Search}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="제목, 태그로 검색"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									setAppliedQuery(searchQuery);
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
								<Button className="bg-card border-card text-main-text rounded-full w-10 h-10">
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
								isSeriesOn ? "" : "text-theme-primary"
							)}
							onClick={() => {
								setIsSeriesOn(false);
							}}
						>
							글
						</button>
						<button
							className={cn(
								"Tab block font-medium text-sub-text bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer",
								isSeriesOn ? "text-theme-primary" : ""
							)}
							onClick={() => {
								setIsSeriesOn(true);
							}}
						>
							시리즈
						</button>
					</div>
					<div
						className={cn(
							"h-0.5 bg-sub-text relative after:absolute after:top-0 after:block after:w-1/2 after:h-0.5 after:bg-theme-primary after:transition-all after:duration-300 after:ease-in-out",
							isSeriesOn ? "after:right-0" : "after:right-1/2"
						)}
					/>
				</div>
				{isSeriesOn && (
					<div
						className={cn("grid gap-2.5 mt-10", `grid-cols-${postsPerRow}`)}
						style={{
							gridTemplateColumns: `repeat(${postsPerRow}, minmax(0, 1fr))`,
						}}
					>
						{pagedSeriesData.map((el) => (
							<ItemCard data={el} key={el.id} />
						))}
					</div>
				)}
				{!isSeriesOn && (
					<>
						<div className="mt-3 flex items-center justify-between">
							<span className="text-sm text-sub-text">
								총 {listTotalCount}개
							</span>
							<button
								type="button"
								onClick={() =>
									setSortOrder((prev) =>
										prev === "latest"
											? "oldest"
											: prev === "oldest"
												? "title"
												: "latest"
									)
								}
								className="text-theme-primary font-medium inline-flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"
							>
								<ArrowUpDown size={14} className="text-theme-primary" />
								{sortOrder === "latest"
									? "최신순"
									: sortOrder === "oldest"
										? "오래된순"
										: "제목순"}
							</button>
						</div>
						<div className="mt-3 flex flex-col min-h-[520px]">
							<div
								className={cn(
									"grid transition-opacity duration-300 ease-out",
									isListReady ? "opacity-100" : "opacity-0",
									isCardOn
										? `gap-2.5 grid-cols-${postsPerRow}`
										: "gap-4 grid-cols-1"
								)}
								style={
									isCardOn
										? {
												gridTemplateColumns: `repeat(${postsPerRow}, minmax(0, 1fr))`,
										  }
										: undefined
								}
							>
								{isCardOn && (
									<>
										{pagedListData.map((el) => (
											<ItemGallery data={el} key={el.id} />
										))}
									</>
								)}
								{!isCardOn && layoutType === "listWithImage" && (
									<>
										{pagedListData.map((el) => (
											<ItemListWithImage data={el} key={el.id} />
										))}
									</>
								)}
								{!isCardOn && layoutType === "list" && (
									<>
										{pagedListData.map((el) => (
											<ItemList data={el} key={el.id} />
										))}
									</>
								)}
							</div>
							{tagOptions.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-6 justify-center">
									<button
										type="button"
										className={cn(
											"px-3 py-1 text-xs font-medium rounded-full border",
											activeTag === "전체"
												? "bg-theme-primary/10 text-theme-primary border-theme-primary/20"
												: "bg-card border-card text-sub-text hover:border-theme-primary/40"
										)}
										onClick={() => setActiveTag("전체")}
									>
										전체
									</button>
									{tagOptions.map((tag) => (
										<button
											key={tag}
											type="button"
											className={cn(
												"px-3 py-1 text-xs font-medium rounded-full border",
												activeTag === tag
													? "bg-theme-primary/10 text-theme-primary border-theme-primary/20"
													: "bg-card border-card text-sub-text hover:border-theme-primary/40"
											)}
											onClick={() => setActiveTag(tag)}
										>
											{tag}
										</button>
									))}
								</div>
							)}
							{totalPages > 1 && (
								<div className="flex justify-center mt-auto pt-7">
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													href="#"
													onClick={(e) => {
														e.preventDefault();
														setActivePage(Math.max(1, currentPageSafe - 1));
													}}
												/>
											</PaginationItem>
											{Array.from({ length: totalPages }).map((_, index) => {
												const page = index + 1;
												return (
													<PaginationItem key={page}>
														<PaginationLink
															href="#"
															isActive={page === currentPageSafe}
															onClick={(e) => {
																e.preventDefault();
																setActivePage(page);
															}}
														>
															{page}
														</PaginationLink>
													</PaginationItem>
												);
											})}
											<PaginationItem>
												<PaginationNext
													href="#"
													onClick={(e) => {
														e.preventDefault();
														setActivePage(
															Math.min(totalPages, currentPageSafe + 1)
														);
													}}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</>
	);
}
