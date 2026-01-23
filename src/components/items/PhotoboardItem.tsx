/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
	Bookmark,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Repeat2,
	Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhotoBoardPost } from "@/data/photoboard";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";

interface PhotoboardItemProps {
	post: PhotoBoardPost;
	isLiked: boolean;
	isReposted: boolean;
	isBookmarked: boolean;
	isExpanded: boolean;
	absoluteDate: string;
	relativeDate: string;
	canManage: boolean;
	onToggleLike: () => void;
	onToggleRepost: () => void;
	onToggleBookmark: () => void;
	onToggleExpand: () => void;
	onShare: () => void;
	onEdit: () => void;
	onDelete: () => void;
	onClick: () => void;
}

const getInitial = (value: string) => value.trim().charAt(0).toUpperCase();
const isRemoteImage = (src: string) => src.startsWith("http");
const shouldTruncate = (caption: string) => caption.length > 120;

export default function PhotoboardItem({
	post,
	isLiked,
	isReposted,
	isBookmarked,
	isExpanded,
	absoluteDate,
	relativeDate,
	canManage,
	onToggleLike,
	onToggleRepost,
	onToggleBookmark,
	onToggleExpand,
	onShare,
	onEdit,
	onDelete,
	onClick,
}: PhotoboardItemProps) {
	const caption = post.caption;
	const showMore = shouldTruncate(caption);
	const [isImageLoaded, setIsImageLoaded] = useState(false);

	useEffect(() => {
		setIsImageLoaded(false);
	}, [post.imageUrl]);

	return (
		<article
			id={post.id}
			className="mb-6 break-inside-avoid rounded-card border-card bg-card backdrop-blur-card overflow-hidden shadow-sm"
		>
			<div className="flex items-center justify-between px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full overflow-hidden border border-card bg-card-bg flex items-center justify-center">
						{post.author?.avatarUrl ? (
							isRemoteImage(post.author.avatarUrl) ? (
								<Image
									src={post.author.avatarUrl}
									alt={post.author.name}
									width={36}
									height={36}
									className="w-full h-full object-cover"
								/>
							) : (
								<img
									src={post.author.avatarUrl}
									alt={post.author.name}
									className="w-full h-full object-cover"
								/>
							)
						) : (
							<span className="text-xs font-semibold text-sub-text">
								{getInitial(post.author?.name || "게스트")}
							</span>
						)}
					</div>
					<div className="flex flex-col">
						<span className="text-sm font-semibold text-main-text">
							{post.author?.name || "게스트"}
						</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="text-xs text-sub-text cursor-default">
									{relativeDate}
								</span>
							</TooltipTrigger>
							<TooltipContent className="text-xs">
								{absoluteDate}
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
				{canManage ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="w-8 h-8 rounded-full flex items-center justify-center text-sub-text hover:text-main-text hover:bg-card-bg"
								aria-label="게시글 메뉴"
							>
								<MoreHorizontal size={18} />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={onEdit}>
								수정하기
							</DropdownMenuItem>
							<DropdownMenuItem className="text-red-400" onClick={onDelete}>
								삭제하기
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</div>

			<div
				className="relative w-full bg-card-bg overflow-hidden cursor-pointer group"
				onClick={onClick}
			>
				<div
					className={cn(
						"absolute inset-0 bg-card animate-pulse transition-opacity",
						isImageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
					)}
				/>
				<img
					src={post.imageUrl}
					alt={post.caption}
					className={cn(
						"w-full h-auto object-cover transition-opacity duration-300",
						isImageLoaded ? "opacity-100" : "opacity-0"
					)}
					loading="lazy"
					decoding="async"
					onLoad={() => setIsImageLoaded(true)}
					onError={() => setIsImageLoaded(true)}
				/>
			</div>

			<div className="px-4 py-3 space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={onToggleLike}
							className={cn(
								"flex items-center justify-center transition-transform",
								isLiked ? "text-pink-500 scale-105" : "text-sub-text"
							)}
							aria-label="좋아요"
						>
							<Heart size={20} fill={isLiked ? "currentColor" : "none"} />
						</button>
						<button
							type="button"
							className="text-sub-text hover:text-main-text transition-colors"
							aria-label="코멘트"
						>
							<MessageCircle size={20} />
						</button>
						<button
							type="button"
							onClick={onToggleRepost}
							className={cn(
								"transition-colors",
								isReposted ? "text-emerald-400" : "text-sub-text"
							)}
							aria-label="재게시"
						>
							<Repeat2 size={20} />
						</button>
						<button
							type="button"
							onClick={onShare}
							className="text-sub-text hover:text-main-text transition-colors"
							aria-label="공유하기"
						>
							<Share2 size={20} />
						</button>
					</div>
					<button
						type="button"
						onClick={onToggleBookmark}
						className={cn(
							"transition-colors",
							isBookmarked ? "text-amber-400" : "text-sub-text"
						)}
						aria-label="북마크"
					>
						<Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
					</button>
				</div>

				<p className="text-sm text-sub-text">
					좋아요 {post.likeCount.toLocaleString()}개
				</p>

				<div className="text-sm text-main-text leading-relaxed">
					<p className={cn(!isExpanded && "line-clamp-2")}>{caption}</p>
					{showMore && (
						<button
							type="button"
							onClick={onToggleExpand}
							className="text-xs text-sub-text mt-1 hover:text-theme-primary"
						>
							{isExpanded ? "접기" : "더보기"}
						</button>
					)}
					{post.tags?.length ? (
						<div className="flex flex-wrap gap-2 pt-3">
							{post.tags.map((tag) => (
								<span
									key={`${post.id}-${tag}`}
									className="text-xs text-theme-primary bg-theme-primary/10 px-2 py-1 rounded-full"
								>
									#{tag}
								</span>
							))}
						</div>
					) : null}
				</div>
			</div>
		</article>
	);
}
