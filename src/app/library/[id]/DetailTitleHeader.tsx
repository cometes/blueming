"use client";

import Image from "next/image";
import { Eye } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/components/ui/badge";
import { dateTimeConvert } from "@/shared/lib/date";
import type { LibraryDetailData } from "@/features/library/types";

/** 상세 타이틀 영역: 제목/부제/작성자/작성일/조회수/태그 */
export default function DetailTitleHeader({
	detail,
}: {
	detail: LibraryDetailData | null | undefined;
}) {
	const authorName =
		typeof detail?.author === "string" && detail.author.trim()
			? detail.author
			: "익명";
	const authorPhotoURL =
		typeof detail?.authorPhotoURL === "string" ? detail.authorPhotoURL : "";
	const authorInitial = authorName.trim().charAt(0) || "익";

	return (
		<div className="TitleWrap mt-15">
			<h1 className="Title text-2xl text-main-text font-bold tracking-normal font-title">
				{detail?.title}
			</h1>
			<h2 className="Subtitle text-sm text-sub-text mt-1 font-medium">
				{detail?.subtitle}
			</h2>
			<div className="mt-4 flex items-center gap-2 text-sm text-sub-text">
				{authorPhotoURL ? (
					<div className="relative w-8 h-8 rounded-full overflow-hidden">
						<Image
							src={authorPhotoURL}
							alt={authorName}
							fill
							className="object-cover"
						/>
					</div>
				) : (
					<div className="w-8 h-8 rounded-full bg-card-bg border border-card flex items-center justify-center text-xs font-medium text-main-text">
						{authorInitial}
					</div>
				)}
				<span className="font-medium text-main-text">{authorName}</span>
				<span className="text-border">•</span>
				<span suppressHydrationWarning>
					{dateTimeConvert(detail?.createdAt ?? "")}
				</span>
				<span className="text-border">•</span>
				<span className="inline-flex items-center gap-1 text-sub-text">
					<Eye size={13} aria-hidden="true" />
					<span>{detail?.viewCount ?? 0}</span>
				</span>
			</div>
			{(detail?.tags?.length ?? 0) > 0 && (
				<div className="TagBox flex mt-4">
					<div className="flex flex-wrap gap-2">
						{detail?.tags?.map((tag, index) => (
							<Badge
								key={index}
								variant="secondary"
								className={cn(
									"px-3 text-xs font-medium rounded-full",
									"bg-white/60 text-theme-primary border-theme-primary/80",
								)}
								style={{
									transition:
										"background-color 200ms, color 200ms, border-color 200ms",
								}}
							>
								{tag}
							</Badge>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
