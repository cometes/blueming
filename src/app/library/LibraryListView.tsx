"use client";

import { ArrowUpDown, Pin, Lock } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/shared/lib/utils";
import { dateConvert } from "@/shared/lib/date";
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

import type { LibraryItemSummary as LibraryItem } from "@/features/library/types";

interface LibraryListViewProps {
	listItems: LibraryItem[];
	pinnedItems: LibraryItem[];
	listTotalCount: number;
	isLoading?: boolean;
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
	isLoading = false,
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
	const isEmpty = listItems.length === 0 && pinnedItems.length === 0;

	return (
		<>
			<div className="mt-3 flex items-center justify-between">
				<span className="text-sm text-sub-text font-title">
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
									: "latest",
						)
					}
					className="text-theme-primary font-medium inline-flex items-center gap-1 hover:opacity-70 cursor-pointer font-title"
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
			<div className="mt-3 flex flex-col min-h-[520px]">
				{isLoading && isEmpty ? (
					<div className="min-h-[520px] w-full" aria-hidden="true" />
				) : (
					<>
						{pinnedItems.length > 0 && (
							<div className="rounded-card border-card bg-card backdrop-blur-card mb-3">
								<div className="divide-y divide-card-bg">
									{pinnedItems.map((item) => (
										<button
											key={item.id}
											type="button"
											onClick={onClickMoveToPage(
												`/library/${item.slug || item.id}${detailQuery}`,
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
												<span className="text-sm text-main-text truncate font-title">
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
								"grid",
								isCardOn
									? "gap-1.5 md:gap-2.5 grid-cols-2 md:[grid-template-columns:repeat(var(--library-cols),minmax(0,1fr))]"
									: "gap-2 md:gap-3 grid-cols-1",
							)}
							style={
								isCardOn
									? ({
											["--library-cols"]: postsPerRow,
											transition: "opacity 0.3s ease-out",
										} as CSSProperties)
									: {
											transition: "opacity 0.3s ease-out",
										}
							}
						>
							{isCardOn && (
								<>
									{listItems.map((el) => (
										<ItemGallery
											key={el.id}
											data={el}
											detailQuery={detailQuery}
										/>
									))}
								</>
							)}
							{!isCardOn && layoutType === "listWithImage" && (
								<>
									{listItems.map((el) => (
										<ItemListWithImage
											key={el.id}
											data={el}
											detailQuery={detailQuery}
										/>
									))}
								</>
							)}
							{!isCardOn && layoutType === "list" && (
								<>
									{listItems.map((el) => (
										<ItemList key={el.id} data={el} detailQuery={detailQuery} />
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
											: "bg-card border-card text-sub-text hover:border-theme-primary/40",
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
												: "bg-card border-card text-sub-text hover:border-theme-primary/40",
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
												onClick={(e) => {
													e.preventDefault();
													setActivePage(
														Math.min(totalPages, currentPageSafe + 1),
													);
												}}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							</div>
						)}
					</>
				)}
			</div>
		</>
	);
}
