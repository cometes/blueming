"use client";

import { useState } from "react";
import {
	Bookmark,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Plus,
	Repeat2,
	Share2,
} from "lucide-react";
import { photoBoardPosts, type PhotoBoardPost } from "@/data/photoboard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import PhotoboardCreateModal from "@/components/modal/PhotoboardCreateModal";

const formatAbsoluteDate = (iso: string) => {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleString("ko-KR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const formatRelative = (iso: string) => {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	const diff = Date.now() - date.getTime();
	const seconds = Math.floor(diff / 1000);
	if (seconds < 60) return "방금 전";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}분 전`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}시간 전`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}일 전`;
	const weeks = Math.floor(days / 7);
	if (weeks < 4) return `${weeks}주 전`;
	const months = Math.floor(days / 30);
	if (months < 12) return `${months}개월 전`;
	const years = Math.floor(days / 365);
	return `${years}년 전`;
};

const shouldTruncate = (caption: string) => caption.length > 120;
const getInitial = (value: string) => value.trim().charAt(0).toUpperCase();
export default function PhotoBoardClient() {
	const [liked, setLiked] = useState<Record<string, boolean>>({});
	const [reposted, setReposted] = useState<Record<string, boolean>>({});
	const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const [posts, setPosts] = useState<PhotoBoardPost[]>(() => photoBoardPosts);
	const [composerOpen, setComposerOpen] = useState(false);

	const handleShare = async (post: PhotoBoardPost) => {
		const link = `${window.location.origin}/photoboard#${post.id}`;
		try {
			await navigator.clipboard.writeText(link);
			toast.success("링크가 복사되었습니다.");
		} catch {
			toast.error("링크 복사에 실패했습니다.");
		}
	};

	return (
		<div className="w-full max-w-[1200px] mx-auto px-6 pt-16 pb-20">
			<header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm text-sub-text">포토보드</p>
					<h1 className="text-3xl font-bold text-main-text mt-2">
						포토보드
					</h1>
					<p className="text-sm text-sub-text mt-2">
						이미지와 짧은 기록을 한눈에 모아보는 공간이에요.
					</p>
				</div>
				<Button
					type="button"
					onClick={() => setComposerOpen(true)}
					className="gap-2 bg-theme-primary text-white hover:bg-theme-primary/90"
				>
					<Plus size={16} />
					+ 새 글쓰기
				</Button>
			</header>

			<div className="columns-1 sm:columns-2 lg:columns-3 gap-2">
				{posts.map((post) => {
					const isLiked = liked[post.id] ?? false;
					const isReposted = reposted[post.id] ?? false;
					const isBookmarked = bookmarked[post.id] ?? false;
					const isExpanded = expanded[post.id] ?? false;
					const caption = post.caption;
					const showMore = shouldTruncate(caption);
					const absoluteDate = formatAbsoluteDate(post.createdAt);
					const relativeDate = formatRelative(post.createdAt);

					return (
						<article
							key={post.id}
							id={post.id}
							className="mb-6 break-inside-avoid rounded-card border-card bg-card backdrop-blur-card overflow-hidden shadow-sm"
						>
							<div className="flex items-center justify-between px-4 py-3">
								<div className="flex items-center gap-3">
									<div className="w-9 h-9 rounded-full overflow-hidden border border-card bg-card-bg flex items-center justify-center">
										{post.author.avatarUrl ? (
											<img
												src={post.author.avatarUrl}
												alt={post.author.name}
												className="w-full h-full object-cover"
											/>
										) : (
											<span className="text-xs font-semibold text-sub-text">
												{getInitial(post.author.name)}
											</span>
										)}
									</div>
									<div className="flex flex-col">
										<span className="text-sm font-semibold text-main-text">
											{post.author.name}
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
										<DropdownMenuItem>수정하기</DropdownMenuItem>
										<DropdownMenuItem className="text-red-400">
											삭제하기
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							<div className="w-full bg-card-bg">
								<img
									src={post.imageUrl}
									alt={post.caption}
									className="w-full h-full object-cover"
									loading="lazy"
								/>
							</div>

							<div className="px-4 py-3 space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<button
											type="button"
											onClick={() =>
												setLiked((prev) => ({
													...prev,
													[post.id]: !isLiked,
												}))
											}
											className={cn(
												"flex items-center justify-center transition-transform",
												isLiked ? "text-pink-500 scale-105" : "text-sub-text"
											)}
											aria-label="좋아요"
										>
											<Heart
												size={20}
												fill={isLiked ? "currentColor" : "none"}
											/>
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
											onClick={() =>
												setReposted((prev) => ({
													...prev,
													[post.id]: !isReposted,
												}))
											}
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
											onClick={() => handleShare(post)}
											className="text-sub-text hover:text-main-text transition-colors"
											aria-label="공유하기"
										>
											<Share2 size={20} />
										</button>
									</div>
									<button
										type="button"
										onClick={() =>
											setBookmarked((prev) => ({
												...prev,
												[post.id]: !isBookmarked,
											}))
										}
										className={cn(
											"transition-colors",
											isBookmarked ? "text-amber-400" : "text-sub-text"
										)}
										aria-label="북마크"
									>
										<Bookmark
											size={20}
											fill={isBookmarked ? "currentColor" : "none"}
										/>
									</button>
								</div>

								<p className="text-sm text-sub-text">
									좋아요 {post.likeCount.toLocaleString()}개
								</p>

								<div className="text-sm text-main-text leading-relaxed">
									<p className={cn(!isExpanded && "line-clamp-2")}>
										{caption}
									</p>
									{showMore && (
										<button
											type="button"
											onClick={() =>
												setExpanded((prev) => ({
													...prev,
													[post.id]: !isExpanded,
												}))
											}
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
				})}
			</div>

			<PhotoboardCreateModal
				isOpen={composerOpen}
				onOpenChange={setComposerOpen}
				onCreate={(newPost) => {
					setPosts((prev) => [newPost, ...prev]);
					toast.success("새 게시물이 추가되었습니다.");
				}}
			/>
		</div>
	);
}
