"use client";

import { cn } from "@/lib/utils";
import ItemCard from "@/components/items/Card";

interface LibraryItem {
	id: string;
	title: string;
	subtitle?: string;
	slug?: string;
	createdAt: string;
	tags?: string[];
	thumbnail?: string;
	pinned?: boolean;
}

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
			className={cn("grid gap-2.5 mt-10", `grid-cols-${postsPerRow}`)}
			style={{
				gridTemplateColumns: `repeat(${postsPerRow}, minmax(0, 1fr))`,
			}}
		>
			{seriesItems.map((el) => (
				<ItemCard data={el} key={el.id} />
			))}
		</div>
	);
}
