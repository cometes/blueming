/* eslint-disable @next/next/no-img-element */
"use client";

import { MoreHorizontal } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { dateTimeConvert } from "@/shared/lib/date";
import type { MemoDetail } from "@/features/memo/types";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MemoArticleProps {
	memo: MemoDetail;
	canManage: boolean;
	onEdit: () => void;
	onDelete: () => void;
	onOpenImageModal: (images: string[], index: number) => void;
}

/** 메모 상세 본문: 작성자 행 + 제목/내용 + 이미지 그리드 + 태그 */
export default function MemoArticle({
	memo,
	canManage,
	onEdit,
	onDelete,
	onOpenImageModal,
}: MemoArticleProps) {
	return (
		<article className="p-5">
			<div className="flex items-center justify-between text-sm text-sub-text">
				<div className="flex items-center gap-2.5">
					<div className="w-9 h-9 rounded-full overflow-hidden border border-card">
						{memo.author?.avatarUrl ? (
							<img
								src={memo.author.avatarUrl}
								alt={memo.author?.name ?? "작성자"}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-xs font-medium">
								{memo.author?.name?.charAt(0) ?? "?"}
							</div>
						)}
					</div>
					<span>{memo.author?.name ?? "게스트"}</span>
					<span suppressHydrationWarning>
						{memo.createdAt ? dateTimeConvert(memo.createdAt) : ""}
					</span>
				</div>
				{canManage && (
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="w-8 h-8 rounded-full flex items-center justify-center text-sub-text hover:text-main-text hover:bg-card-bg"
								aria-label="메모 메뉴"
							>
								<MoreHorizontal size={18} />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={onEdit}>수정하기</DropdownMenuItem>
							<DropdownMenuItem className="text-red-400" onSelect={onDelete}>
								삭제하기
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			<h1 className="text-xl font-bold text-main-text mt-2.5 font-title">
				{memo.title}
			</h1>

			<div className="text-sm text-main-text whitespace-pre-line leading-relaxed mt-2.5">
				{memo.content}
			</div>

			{memo.imageUrls && (memo.imageUrls?.length ?? 0) > 0 && (
				<div
					className={cn(
						"grid gap-2 mt-4",
						(memo.imageUrls?.length ?? 0) === 1 && "grid-cols-1",
						(memo.imageUrls?.length ?? 0) === 2 && "grid-cols-2",
						(memo.imageUrls?.length ?? 0) >= 3 && "grid-cols-2 grid-rows-2",
					)}
				>
					{memo.imageUrls.slice(0, 4).map((url, index) => (
						<button
							key={`${url}-${index}`}
							type="button"
							onClick={() => onOpenImageModal(memo.imageUrls ?? [], index)}
							className={cn(
								"relative rounded-card border border-card overflow-hidden text-left",
								(memo.imageUrls?.length ?? 0) === 1
									? "aspect-[4/3]"
									: "aspect-square",
								(memo.imageUrls?.length ?? 0) === 3 &&
									index === 0 &&
									"row-span-2",
							)}
							aria-label={`이미지 ${index + 1} 확대 보기`}
						>
							<img
								src={url}
								alt="첨부 이미지"
								className="absolute inset-0 w-full h-full object-cover"
							/>
						</button>
					))}
				</div>
			)}

			{memo.tags && memo.tags.length > 0 && (
				<div className="flex flex-wrap gap-1.5 mt-2.5">
					{memo.tags.map((tag, idx) => (
						<span
							key={idx}
							className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20"
						>
							{tag}
						</span>
					))}
				</div>
			)}
		</article>
	);
}
