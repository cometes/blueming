"use client";

import { useState } from "react";
import {
	Pin,
	Pencil,
	Trash2,
	Link as LinkIcon,
	Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";

interface DetailToolbarProps {
	onBackToList: () => void;
	isAdmin: boolean;
	isOwner: boolean;
	isPinned: boolean;
	onTogglePin: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

/** 상세 상단 툴바: 목록으로 / 링크 복사 / (관리자·작성자) 고정·수정·삭제 */
export default function DetailToolbar({
	onBackToList,
	isAdmin,
	isOwner,
	isPinned,
	onTogglePin,
	onEdit,
	onDelete,
}: DetailToolbarProps) {
	const [linkCopied, setLinkCopied] = useState(false);

	const handleCopyLink = () => {
		const url = decodeURIComponent(window.location.href);
		navigator.clipboard
			.writeText(url)
			.then(() => {
				setLinkCopied(true);
				setTimeout(() => setLinkCopied(false), 2000);
			})
			.catch(() => {});
	};

	return (
		<div className="flex items-center justify-between mt-10">
			<Button onClick={onBackToList}>목록으로</Button>
			<div className="flex items-center gap-3">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={handleCopyLink}
							className={cn(
								"w-8 h-8 rounded-full bg-card flex items-center justify-center border border-card cursor-pointer",
								linkCopied ? "text-theme-primary" : "text-sub-text",
							)}
							style={{ transition: "color 200ms ease-out" }}
							aria-label="링크 복사"
						>
							{linkCopied ? <Check size={16} /> : <LinkIcon size={16} />}
						</button>
					</TooltipTrigger>
					<TooltipContent className="text-xs">
						{linkCopied ? "복사됨!" : "링크 복사"}
					</TooltipContent>
				</Tooltip>
				{(isAdmin || isOwner) && (
					<>
						{isAdmin && (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										onClick={onTogglePin}
										className={cn(
											"w-8 h-8 rounded-full bg-card flex items-center justify-center border border-card cursor-pointer",
											isPinned ? "text-theme-primary" : "text-sub-text",
										)}
										style={{ transition: "color 200ms ease-out" }}
										aria-label="공지로 설정"
									>
										<Pin size={16} />
									</button>
								</TooltipTrigger>
								<TooltipContent className="text-xs">
									{isPinned ? "공지 해제" : "공지로 설정"}
								</TooltipContent>
							</Tooltip>
						)}
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={onEdit}
									className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-card text-sub-text cursor-pointer"
									style={{ transition: "color 200ms ease-out" }}
									aria-label="수정"
								>
									<Pencil size={16} />
								</button>
							</TooltipTrigger>
							<TooltipContent className="text-xs">수정</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={onDelete}
									className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-card text-sub-text cursor-pointer"
									style={{ transition: "color 200ms ease-out" }}
									aria-label="삭제"
								>
									<Trash2 size={16} />
								</button>
							</TooltipTrigger>
							<TooltipContent className="text-xs">삭제</TooltipContent>
						</Tooltip>
					</>
				)}
			</div>
		</div>
	);
}
