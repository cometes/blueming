"use client";

import { Lock, Pencil, ShieldCheck, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Comment } from "@/queries/comment";

interface CommentItemProps {
	comment: Comment;
	isOwn: boolean;
	visibleSecret: boolean;
	canViewSecret: boolean;
	canEdit: boolean;
	canDelete: boolean;
	onToggleSecret: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

export default function CommentItem({
	comment,
	isOwn,
	visibleSecret,
	canViewSecret,
	canEdit,
	canDelete,
}: CommentItemProps) {
	const showSecretContent = !comment.isSecret || visibleSecret;
	const imageUrls = comment.imageUrls ?? [];

	const formatTime = (dateString: string | null) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		return date.toLocaleTimeString("ko-KR", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		return date.toLocaleDateString("ko-KR", {
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div
			className={cn("flex gap-2 mb-3", isOwn ? "flex-row-reverse" : "flex-row")}
		>
			{/* 프로필 이미지 */}
			{!isOwn && (
				<div className="flex-shrink-0">
					{comment.photoURL ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={comment.photoURL}
							alt={comment.displayName}
							className="w-8 h-8 rounded-full object-cover"
						/>
					) : (
						<div className="w-8 h-8 rounded-full bg-card border border-card flex items-center justify-center text-xs text-sub-text">
							{comment.displayName?.charAt(0) || "U"}
						</div>
					)}
				</div>
			)}

			{/* 메시지 영역 */}
			<div
				className={cn(
					"flex flex-col max-w-[75%]",
					isOwn ? "items-end" : "items-start",
				)}
			>
				{/* 닉네임 & 뱃지 */}
				{!isOwn && (
					<div className="flex items-center gap-1.5 mb-1">
						<span className="text-xs font-medium text-main-text font-title">
							{comment.displayName}
						</span>
						{comment.isAdmin && (
							<span className="text-[10px] text-theme-primary inline-flex items-center gap-0.5">
								<ShieldCheck size={10} />
								관리자
							</span>
						)}
						<span className="text-[10px] text-sub-text">
							{comment.authorType === "anon" ? "익명" : ""}
						</span>
					</div>
				)}

				{/* 말풍선 */}
				<div
					className={cn(
						"relative group rounded-2xl px-3 py-2 break-words",
						isOwn
							? "bg-theme-primary text-white rounded-br-sm"
							: "bg-card-bg border border-card rounded-bl-sm",
					)}
				>
					{/* 비밀글 표시 */}
					{comment.isSecret && (
						<div
							className={cn(
								"flex items-center gap-1 text-[10px] mb-1",
								isOwn ? "text-white/70" : "text-sub-text",
							)}
						>
							<Lock size={10} />
							비밀글
						</div>
					)}

					{/* 메시지 내용 */}
					{comment.isSecret && !showSecretContent ? (
						<div className="flex flex-wrap items-center gap-2">
							<span
								className={cn(
									"text-sm",
									isOwn ? "text-white/80" : "text-sub-text",
								)}
							>
								비밀글입니다.
							</span>
							{canViewSecret && (
								<button
									type="button"
									disabled
									className={cn(
										"text-xs hover:opacity-70",
										isOwn ? "text-white underline" : "text-theme-primary",
									)}
								>
									보기
								</button>
							)}
						</div>
					) : (
						<p
							className={cn(
								"text-sm whitespace-pre-wrap",
								isOwn ? "text-white" : "text-main-text",
							)}
						>
							{comment.message}
						</p>
					)}

					{/* 이미지 */}
					{imageUrls.length > 0 && showSecretContent && (
						<div className="mt-2 flex flex-wrap gap-1">
							{imageUrls.map((url, index) => (
								<button
									key={`${comment.id}-image-${index}`}
									type="button"
									disabled
									className="relative aspect-square min-w-12 rounded-card overflow-hidden border border-gray-400"
									aria-label={`이미지 ${index + 1} 확대 보기`}
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={url}
										alt="첨부 이미지"
										className="absolute inset-0 w-full h-full object-cover"
									/>
								</button>
							))}
						</div>
					)}

					{/* 수정/삭제 메뉴 (호버 시 표시) */}
					{(canEdit || canDelete) && showSecretContent && (
						<div
							className={cn(
								"absolute opacity-0 group-hover:opacity-100 transition-opacity",
								isOwn ? "-left-6 bottom-0" : "-right-6 bottom-0",
							)}
						>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										disabled
										className="w-6 h-6 p-0 rounded-full"
									>
										<MoreVertical size={12} />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align={isOwn ? "end" : "start"}>
									{canEdit && (
										<DropdownMenuItem disabled>
											<Pencil size={12} className="mr-2" />
											수정
										</DropdownMenuItem>
									)}
									{canDelete && (
										<DropdownMenuItem className="text-red-500" disabled>
											<Trash2 size={12} className="mr-2" />
											삭제
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}
				</div>

				{/* 시간 */}
				<div
					className={cn(
						"flex items-center gap-1 mt-1 text-[10px] text-sub-text",
						isOwn ? "flex-row-reverse" : "flex-row",
					)}
				>
					<span>{formatDate(comment.createdAt)}</span>
					<span>{formatTime(comment.createdAt)}</span>
				</div>
			</div>

			{/* 내 댓글일 때 프로필 (우측) */}
			{isOwn && (
				<div className="flex-shrink-0">
					{comment.photoURL ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={comment.photoURL}
							alt={comment.displayName}
							className="w-8 h-8 rounded-full object-cover"
						/>
					) : (
						<div className="w-8 h-8 rounded-full bg-theme-primary/20 border border-theme-primary/30 flex items-center justify-center text-xs text-theme-primary">
							{comment.displayName?.charAt(0) || "U"}
						</div>
					)}
				</div>
			)}

		</div>
	);
}
