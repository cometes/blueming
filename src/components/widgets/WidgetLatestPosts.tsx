"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { fetchLibraryList } from "@/queries/fetch/fetchLibrary";
import { dateConvert } from "@/lib/date";
import Link from "next/link";

interface LibraryItem {
	id: string;
	slug?: string;
	title: string;
	createdAt: string;
	allow?: "all" | "password" | "secret";
}

const MAX_ITEMS = 5;
const ROW_HEIGHT = 28;
const HEADER_HEIGHT = 28;
const PADDING_Y = 24;

const useContainerHeight = (ref: React.RefObject<HTMLDivElement>) => {
	const [height, setHeight] = useState(0);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;

		const update = () => {
			const rect = el.getBoundingClientRect();
			setHeight(Math.max(0, rect.height));
		};

		const observer = new ResizeObserver(update);
		observer.observe(el);
		update();

		return () => observer.disconnect();
	}, [ref]);

	return height;
};

export default function WidgetLatestPosts() {
	const containerRef = useRef<HTMLDivElement>(null);
	const containerHeight = useContainerHeight(containerRef);
	const [items, setItems] = useState<LibraryItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isActive = true;

		const load = async () => {
			try {
				setIsLoading(true);
				const { data } = await fetchLibraryList({
					page: 1,
					limit: MAX_ITEMS,
					sort: "latest",
				});
				if (!isActive) return;
				const nextItems = Array.isArray(data?.items) ? data.items : [];
				setItems(nextItems);
			} catch {
				if (!isActive) return;
				setItems([]);
			} finally {
				if (!isActive) return;
				setIsLoading(false);
			}
		};

		load();
		return () => {
			isActive = false;
		};
	}, []);

	const visibleCount = useMemo(() => {
		if (!containerHeight) return 0;
		const available = Math.max(
			0,
			containerHeight - HEADER_HEIGHT - PADDING_Y
		);
		if (!available) return 0;
		const fit = Math.max(1, Math.floor(available / ROW_HEIGHT));
		return Math.min(MAX_ITEMS, fit);
	}, [containerHeight]);

	const visibleItems = useMemo(
		() => items.slice(0, visibleCount || 0),
		[items, visibleCount]
	);
	const skeletonCount = visibleCount || 3;
	const buildDetailHref = (item: LibraryItem) =>
		item.slug ? `/library/${item.slug}` : `/library/${item.id}`;

	return (
		<div className="widget-wrapper" ref={containerRef}>
			<div className="w-full h-full flex flex-col px-4 py-3">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold text-main-text">최신글</h3>
					<span className="text-xs text-sub-text">{Math.min(items.length, MAX_ITEMS)}</span>
				</div>

				<div className="flex-1 mt-2 overflow-hidden">
					{isLoading ? (
						<ul className="flex flex-col gap-1 animate-pulse">
							{Array.from({ length: skeletonCount }).map((_, index) => (
								<li
									key={`skeleton-${index}`}
									className="flex items-center justify-between gap-2"
									style={{ minHeight: `${ROW_HEIGHT}px` }}
								>
									<div className="h-3 w-2/3 rounded-full bg-card-bg/70" />
									<div className="h-3 w-12 rounded-full bg-card-bg/70" />
								</li>
							))}
						</ul>
					) : visibleItems.length === 0 ? (
						<div className="text-xs text-sub-text">최신글이 없습니다.</div>
					) : (
						<ul className="flex flex-col gap-1">
							{visibleItems.map((item) => (
								<li
									key={item.id}
									className="flex items-center justify-between gap-2"
									style={{ minHeight: `${ROW_HEIGHT}px` }}
								>
									<Link
										href={buildDetailHref(item)}
										className="text-sm text-main-text truncate hover:opacity-70 transition-opacity flex items-center justify-between gap-2 w-full"
									>
										<span className="truncate">{item.title}</span>
										<span className="text-xs text-sub-text shrink-0">
											{dateConvert(item.createdAt)}
										</span>
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
