"use client";

import { ArrowUpDown, Pin, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateConvert } from "@/lib/date";
import ItemGallery from "@/components/items/Gallery";
import ItemListWithImage from "@/components/items/ListWithImage";
import ItemList from "@/components/items/List";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

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

interface LibraryListViewProps {
	listItems: LibraryItem[];
	pinnedItems: LibraryItem[];
	listTotalCount: number;
	isLoading: boolean;
	isCardOn: boolean;
	layoutType: "list" | "listWithImage";
	postsPerRow: number;
	tagOptions: string[];
	activeTag: string;
	setActiveTag: (tag: string) => void;
	sortOrder: "latest" | "oldest" | "title";
	setSortOrder: (next: "latest" | "oldest" | "title") => void;
	onClickMoveToPage: (path: string) => () => void;
	detailQuery: string;
	totalPages: number;
	currentPageSafe: number;
	setActivePage: (page: number) => void;
}

export default function LibraryListView({
	listItems,
	pinnedItems,
	listTotalCount,
	isLoading,
	isCardOn,
	layoutType,
	postsPerRow,
	tagOptions,
	activeTag,
	setActiveTag,
	sortOrder,
	setSortOrder,
	onClickMoveToPage,
	detailQuery,
	totalPages,
	currentPageSafe,
	setActivePage,
}: LibraryListViewProps) {
	const skeletonCount = isCardOn ? Math.max(6, postsPerRow * 2) : 6;

	return (
		<>
			<div className="mt-3 flex items-center justify-between">
				<span className="text-sm text-sub-text">
					총 {listTotalCount + pinnedItems.length}개
				</span>
				<button
					type="button"
					onClick={() =>
						setSortOrder(
							sortOrder === "latest"
								? "oldest"
								: sortOrder === "oldest"
								? "title"
								: "latest"
						)
					}
					className="text-theme-primary font-medium inline-flex items-center gap-1 hover:opacity-70 cursor-pointer"
					style={{ transition: "opacity 0.2s ease-out" }}
				>
					<ArrowUpDown size={14} className="text-theme-primary" />
					{sortOrder === "latest"
						? "최신순"
						: sortOrder === "oldest"
						? "오래된순"
						: "제목순"}
				</button>
			</div>
			<div className="mt-3 flex flex-col min-h-[520px] w-full">
				{pinnedItems.length > 0 && (
					<div className="rounded-card border-card bg-card mb-4">
						{/* <div className="px-4 py-3 border-b border-card-bg text-sm font-medium text-main-text">
							공지
						</div> */}
						<div className="divide-y divide-card-bg">
							{pinnedItems.map((item) => (
								<button
									key={item.id}
									type="button"
									onClick={onClickMoveToPage(
									`/library/${item.slug || item.id}${detailQuery}`
									)}
									className="w-full p-2.5 flex items-center justify-between text-left hover:bg-card-bg/50 cursor-pointer"
									style={{
										transition:
											"background-color 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out",
									}}
								>
									<div className="flex items-center gap-2 min-w-0">
										<Pin size={14} className="text-theme-primary" />
										{item.allow === "password" && (
											<Lock size={14} className="text-sub-text shrink-0" />
										)}
										<span className="text-sm text-main-text truncate">
											{item.title}
										</span>
									</div>
									<span className="text-xs text-sub-text shrink-0">
										{dateConvert(item.createdAt)}
									</span>
								</button>
							))}
						</div>
					</div>
				)}
				<div
					className={cn(
						"grid w-full opacity-100",
						isCardOn ? `gap-2.5 grid-cols-${postsPerRow}` : "gap-4 grid-cols-1"
					)}
					style={
						isCardOn
							? {
									gridTemplateColumns: `repeat(${postsPerRow}, minmax(0, 1fr))`,
							  }
							: undefined
					}
				>
					{isLoading && (
						<>
							{Array.from({ length: skeletonCount }).map((_, index) => (
								<div
									key={`library-skeleton-${index}`}
									className={cn(
										"rounded-card border-card bg-card-bg animate-pulse overflow-hidden",
										isCardOn ? "h-[240px]" : "h-[72px]"
									)}
								>
									<div
										className={cn(
											"p-4 space-y-3",
											isCardOn ? "" : "flex items-center justify-between space-y-0"
										)}
									>
										<div className="space-y-2">
											<div className="h-3 w-3/4 rounded-full bg-card" />
											<div className="h-2 w-1/2 rounded-full bg-card" />
										</div>
										<div className="h-2 w-16 rounded-full bg-card" />
									</div>
								</div>
							))}
						</>
					)}
					{!isLoading && isCardOn && (
						<>
							{listItems.map((el) => (
								<ItemGallery data={el} key={el.id} detailQuery={detailQuery} />
							))}
						</>
					)}
					{!isLoading && !isCardOn && layoutType === "listWithImage" && (
						<>
							{listItems.map((el) => (
								<ItemListWithImage
									data={el}
									key={el.id}
									detailQuery={detailQuery}
								/>
							))}
						</>
					)}
					{!isLoading && !isCardOn && layoutType === "list" && (
						<>
							{listItems.map((el) => (
								<ItemList
									data={el}
									key={el.id}
									detailQuery={detailQuery}
								/>
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
								{(() => {
									// 페이지네이션 청크 렌더링: 최대 7개 페이지만 표시
									const maxVisible = 7;
									let startPage = 1;
									let endPage = totalPages;

									if (totalPages > maxVisible) {
										const halfVisible = Math.floor(maxVisible / 2);
										startPage = Math.max(1, currentPageSafe - halfVisible);
										endPage = Math.min(totalPages, startPage + maxVisible - 1);

										// 끝 페이지에 도달했을 때 조정
										if (endPage === totalPages) {
											startPage = Math.max(1, endPage - maxVisible + 1);
										}
									}

									const pages = [];
									for (let i = startPage; i <= endPage; i++) {
										pages.push(
											<PaginationItem key={i}>
												<PaginationLink
													href="#"
													isActive={i === currentPageSafe}
													onClick={(e) => {
														e.preventDefault();
														setActivePage(i);
													}}
												>
													{i}
												</PaginationLink>
											</PaginationItem>
										);
									}
									return pages;
								})()}
								<PaginationItem>
									<PaginationNext
										href="#"
										onClick={(e) => {
											e.preventDefault();
											setActivePage(Math.min(totalPages, currentPageSafe + 1));
										}}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</div>
		</>
	);
}
