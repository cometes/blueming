"use client";

import { useEffect, useRef, useState } from "react";
import { fetchLibraryList } from "@/features/library/api/client";
import { dateConvert } from "@/shared/lib/date";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";

import type { LibraryItemSummary as LibraryItem } from "@/features/library/types";

const MAX_ITEMS = 5;

export default function WidgetLatestPosts({ onReady }: { onReady?: () => void }) {
	const onReadyRef = useRef(onReady);
	onReadyRef.current = onReady;
	const { general } = useSettings();

	const [items, setItems] = useState<LibraryItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isActive = true;

		const load = async () => {
			try {
				const { data } = await fetchLibraryList({
					page: 1,
					limit: MAX_ITEMS,
					sort: "latest",
				});
				if (!isActive) return;
				setItems(Array.isArray(data?.items) ? data.items : []);
			} catch {
				if (!isActive) return;
				setItems([]);
			} finally {
				if (!isActive) return;
				setIsLoading(false);
				onReadyRef.current?.();
			}
		};

		load();
		return () => {
			isActive = false;
		};
	}, []);

	const buildDetailHref = (item: LibraryItem) =>
		item.slug ? `/library/${item.slug}` : `/library/${item.id}`;

	return (
		<div className="widget-wrapper">
			<div className="w-full h-full flex flex-col p-3.5 pr-2">
				<div className="flex items-center justify-between shrink-0">
					<h3 className="text-sm font-semibold text-main-text font-title">최신글</h3>
					<span className="text-xs text-sub-text">{items.length}</span>
				</div>

				<div
					className="flex-1 mt-2 overflow-y-scroll pr-1.5"
					style={{
						scrollbarColor: `${
							general?.design?.widget?.borderColor || "#ccc"
						} transparent`,
						scrollbarWidth: "thin",
					}}
				>
					{isLoading ? (
						<ul className="flex flex-col gap-1 animate-pulse">
							{Array.from({ length: 3 }).map((_, index) => (
								<li
									key={`skeleton-${index}`}
									className="flex items-center gap-2 py-1"
								>
									<div className="h-3 w-2/3 rounded-full bg-card-bg/70" />
									<div className="h-3 w-12 rounded-full bg-card-bg/70" />
								</li>
							))}
						</ul>
					) : items.length === 0 ? (
						<div className="text-xs text-sub-text">최신글이 없습니다.</div>
					) : (
						<ul className="flex flex-col gap-1">
							{items.map((item) => (
								<li key={item.id} className="py-1 min-w-0">
									<Link
										href={buildDetailHref(item)}
										className="text-sm text-main-text hover:opacity-70 transition-opacity flex items-center gap-2 min-w-0"
									>
										<span className="truncate flex-1 min-w-0">{item.title}</span>
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
