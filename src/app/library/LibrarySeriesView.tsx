"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
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
	allow?: "all" | "password" | "secret";
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
			className={cn(
				"grid gap-1.5 md:gap-2 mt-10",
				"grid-cols-2 sm:grid-cols-2 md:[grid-template-columns:repeat(var(--library-cols),minmax(0,1fr))]"
			)}
			style={{ ["--library-cols"]: postsPerRow } as CSSProperties}
		>
			{seriesItems.map((el) => (
				<ItemCard data={el} key={el.id} />
			))}
		</div>
	);
}
