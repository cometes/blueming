"use client";

/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import type { ThreadQuoteSnapshot } from "@/features/thread/types";

interface ThreadQuoteCardProps {
	quote: ThreadQuoteSnapshot;
	/** 컴포저 부착 미리보기 등 클릭 이동이 필요 없는 곳 */
	interactive?: boolean;
}

/**
 * 인용 글 임베드 카드 — 저장 시점 스냅샷(작성자·발췌·첫 이미지) 기반이라
 * 원본이 삭제돼도 표시된다. 클릭 시 원본으로 이동(삭제 시 상세의 404 폴백).
 */
export default function ThreadQuoteCard({
	quote,
	interactive = true,
}: ThreadQuoteCardProps) {
	const router = useRouter();

	return (
		<div
			onClick={(e) => {
				e.stopPropagation();
				if (interactive) router.push(`/thread/${quote.id}`);
			}}
			className={cn(
				"mt-2 flex items-center gap-2.5 rounded-card border border-card bg-card-bg/50 px-3 py-2.5",
				interactive && "cursor-pointer hover:border-theme-primary/50",
			)}
		>
			{quote.imageUrl && (
				<span className="h-10 w-10 shrink-0 overflow-hidden rounded border border-card">
					<img
						src={quote.imageUrl}
						alt=""
						className="h-full w-full object-cover"
					/>
				</span>
			)}
			<div className="min-w-0 flex-1">
				<p className="text-xs font-medium text-main-text">
					{quote.authorName}
				</p>
				<p className="truncate text-xs text-sub-text">
					{quote.excerpt || "(내용 없음)"}
				</p>
			</div>
		</div>
	);
}
