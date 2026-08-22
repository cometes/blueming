"use client";

import { cn } from "@/shared/lib/utils";
import type { CSSProperties } from "react";
import ItemCard from "@/components/items/Card";

import type { LibraryItemSummary as LibraryItem } from "@/features/library/types";

interface LibrarySeriesViewProps {
	postsPerRow: number;
	seriesItems: LibraryItem[];
}

export default function LibrarySeriesView({
	postsPerRow,
	seriesItems,
}: LibrarySeriesViewProps) {
	return (
		<div
			className={cn(
				"grid gap-1.5 md:gap-2 mt-10",
				"grid-cols-2 sm:grid-cols-2 md:[grid-template-columns:repeat(var(--library-cols),minmax(0,1fr))]"
			)}
			style={{ ["--library-cols"]: postsPerRow } as CSSProperties}
		>
			{seriesItems.map((el) => (
				<ItemCard data={el} key={el.series ?? el.id} />
			))}
		</div>
	);
}
