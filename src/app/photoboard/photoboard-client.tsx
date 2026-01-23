"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Settings, X } from "lucide-react";
import { type PhotoBoardPost } from "@/data/photoboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PhotoboardCreateModal from "@/components/modal/PhotoboardCreateModal";
import {
	deletePhotoboardPost,
	fetchPhotoboardPosts,
} from "@/queries/photoboard";
import PhotoboardSettingsDialog from "@/components/modal/PhotoboardSettingsDialog";
import AdminOnly from "@/components/common/AdminOnly";
import { useSettings } from "@/contexts/SettingsContext";
import { setSettingsMainPhotoboard } from "@/queries/set/setSettingsMainPhotoboard";
import { useAuthStore } from "@/store/auth/store";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import PhotoboardItem from "@/components/items/PhotoboardItem";

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

export default function PhotoBoardClient() {
	const { main, updateMain, refreshSettings } = useSettings();
	const { user } = useAuthStore();
	const { isAdmin } = useAdmin();
	const [liked, setLiked] = useState<Record<string, boolean>>({});
	const [reposted, setReposted] = useState<Record<string, boolean>>({});
	const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const [posts, setPosts] = useState<PhotoBoardPost[]>([]);
	const [composerOpen, setComposerOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<PhotoBoardPost | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const [appliedQuery, setAppliedQuery] = useState("");

	const defaultPhotoboardSettings = useMemo(
		() => ({
			postsPerRow: 3,
			writePermission: "member" as const,
		}),
		[]
	);

	const resolvedPhotoboardSettings = useMemo(
		() => ({
			...defaultPhotoboardSettings,
			...(main?.photoboard || {}),
		}),
		[defaultPhotoboardSettings, main]
	);

	const [postsPerRow, setPostsPerRow] = useState(
		resolvedPhotoboardSettings.postsPerRow
	);
	const [writePermission, setWritePermission] = useState<"admin" | "member">(
		resolvedPhotoboardSettings.writePermission
	);

	const [tempPostsPerRow, setTempPostsPerRow] = useState(postsPerRow);
	const [tempWritePermission, setTempWritePermission] =
		useState(writePermission);

	useEffect(() => {
		setPostsPerRow(resolvedPhotoboardSettings.postsPerRow);
		setWritePermission(resolvedPhotoboardSettings.writePermission);
	}, [resolvedPhotoboardSettings]);

	useEffect(() => {
		if (isDialogOpen) {
			setTempPostsPerRow(postsPerRow);
			setTempWritePermission(writePermission);
		}
	}, [isDialogOpen, postsPerRow, writePermission]);

	useEffect(() => {
		let isActive = true;
		fetchPhotoboardPosts()
			.then((data) => {
				if (!isActive) return;
				setPosts(data.items);
			})
			.catch(() => {
				if (!isActive) return;
				toast.error("포토보드 데이터를 불러오지 못했습니다.");
			})
			.finally(() => {
				if (!isActive) return;
				setIsLoading(false);
			});
		return () => {
			isActive = false;
		};
	}, []);

	const handleSaveSettings = async () => {
		try {
			const payload = {
				postsPerRow: tempPostsPerRow,
				writePermission: tempWritePermission,
			};
			await setSettingsMainPhotoboard(payload);
			updateMain?.({ photoboard: payload });
			await refreshSettings?.({ broadcast: true });
			setPostsPerRow(payload.postsPerRow);
			setWritePermission(payload.writePermission);
			setIsDialogOpen(false);
			toast.success("저장되었습니다.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "저장에 실패했습니다.";
			toast.error(message);
		}
	};

	const clampedPostsPerRow = Math.min(Math.max(postsPerRow, 1), 6);
	const columnsClass =
		{
			1: "columns-1 sm:columns-1 lg:columns-1",
			2: "columns-1 sm:columns-2 lg:columns-2",
			3: "columns-1 sm:columns-2 lg:columns-3",
			4: "columns-1 sm:columns-2 lg:columns-4",
			5: "columns-1 sm:columns-2 lg:columns-5",
			6: "columns-1 sm:columns-2 lg:columns-6",
		}[clampedPostsPerRow] ?? "columns-1 sm:columns-2 lg:columns-3";

	const canManagePost = (post: PhotoBoardPost) =>
		Boolean(isAdmin || (user && post.author?.id === user.uid));

	const normalizedQuery = appliedQuery.trim().toLowerCase();
	const filteredPosts = useMemo(() => {
		if (!normalizedQuery) return posts;
		return posts.filter((post) => {
			const tags = Array.isArray(post.tags) ? post.tags.join(" ") : "";
			const haystack = [
				post.caption,
				post.author?.name ?? "",
				tags,
			]
				.join(" ")
				.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [posts, normalizedQuery]);

	const handleDeletePost = async (post: PhotoBoardPost) => {
		const confirmed = window.confirm(
			"게시글을 삭제할까요? 이 작업은 되돌릴 수 없어요."
		);
		if (!confirmed) return;
		try {
			await deletePhotoboardPost(post.id);
			setPosts((prev) => prev.filter((item) => item.id !== post.id));
			toast.success("게시글이 삭제되었습니다.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "삭제에 실패했습니다.";
			toast.error(message);
		}
	};

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
		<div className="w-full max-w-[1200px] mx-auto px-6 mt-[90px] mb-[40px]">
			<header className="mb-10 flex items-center justify-center">
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<div className="w-[150px]">

					</div>
					<div className="w-full sm:w-[200px]">
						<Input
							className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							endIcon={searchInput ? X : Search}
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="본문, 태그로 검색"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									setAppliedQuery(searchInput.trim());
								}
							}}
							onEndIconClick={
								searchInput
									? () => {
											setSearchInput("");
											setAppliedQuery("");
										}
									: undefined
							}
							endIconAriaLabel="검색어 지우기"
						/>
					</div>
					<AdminOnly>
						<PhotoboardSettingsDialog
							isOpen={isDialogOpen}
							onOpenChange={setIsDialogOpen}
							tempPostsPerRow={tempPostsPerRow}
							setTempPostsPerRow={setTempPostsPerRow}
							tempWritePermission={tempWritePermission}
							setTempWritePermission={setTempWritePermission}
							onSave={handleSaveSettings}
							trigger={
								<Button className="bg-card border-card text-main-text rounded-full w-10 h-10 hover:border-transparent">
									<Settings />
								</Button>
							}
						/>
					</AdminOnly>
					{writePermission === "admin" ? (
						<AdminOnly>
							<Button
								type="button"
								onClick={() => setComposerOpen(true)}
								className="gap-2 bg-theme-primary text-white hover:bg-theme-primary/90"
							>
								<Plus size={16} />
								새 글쓰기
							</Button>
						</AdminOnly>
					) : (
						<Button
							type="button"
							onClick={() => setComposerOpen(true)}
							className="gap-2 bg-theme-primary text-white hover:bg-theme-primary/90"
						>
							<Plus size={16} />
							새 글쓰기
						</Button>
					)}
				</div>
			</header>

			{isLoading ? (
				<div className={`${columnsClass} gap-2`}>
					{Array.from({ length: 6 }).map((_, index) => (
						<div
							key={`photoboard-skeleton-${index}`}
							className="mb-6 break-inside-avoid rounded-card border-card bg-card-bg overflow-hidden animate-pulse"
						>
							<div className="px-4 py-3 flex items-center gap-3">
								<div className="w-9 h-9 rounded-full bg-card" />
								<div className="space-y-2">
									<div className="h-3 w-24 rounded-full bg-card" />
									<div className="h-2 w-16 rounded-full bg-card" />
								</div>
							</div>
							<div className="w-full aspect-[4/3] bg-card" />
							<div className="px-4 py-4 space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="h-4 w-4 rounded-full bg-card" />
										<div className="h-4 w-4 rounded-full bg-card" />
										<div className="h-4 w-4 rounded-full bg-card" />
										<div className="h-4 w-4 rounded-full bg-card" />
									</div>
									<div className="h-4 w-4 rounded-full bg-card" />
								</div>
								<div className="h-3 w-24 rounded-full bg-card" />
								<div className="space-y-2">
									<div className="h-3 w-full rounded-full bg-card" />
									<div className="h-3 w-4/5 rounded-full bg-card" />
								</div>
							</div>
						</div>
					))}
				</div>
			) : filteredPosts.length === 0 ? (
				<div className="rounded-card border-card bg-card-bg text-center py-16 px-6">
					{posts.length === 0 ? (
						<>
							<p className="text-sm text-sub-text">
								아직 포토보드가 비어 있어요.
							</p>
							<p className="text-base text-main-text mt-2">
								첫 게시물을 만들어보세요.
							</p>
						</>
					) : (
						<>
							<p className="text-sm text-sub-text">검색 결과가 없어요.</p>
							<p className="text-base text-main-text mt-2">
								다른 검색어로 시도해보세요.
							</p>
						</>
					)}
				</div>
			) : (
				<div className={`${columnsClass} gap-2`}>
					{filteredPosts.map((post) => {
						const isLiked = liked[post.id] ?? false;
						const isReposted = reposted[post.id] ?? false;
						const isBookmarked = bookmarked[post.id] ?? false;
						const isExpanded = expanded[post.id] ?? false;
						const absoluteDate = formatAbsoluteDate(post.createdAt);
						const relativeDate = formatRelative(post.createdAt);

						return (
							<PhotoboardItem
								key={post.id}
								post={post}
								isLiked={isLiked}
								isReposted={isReposted}
								isBookmarked={isBookmarked}
								isExpanded={isExpanded}
								absoluteDate={absoluteDate}
								relativeDate={relativeDate}
								canManage={canManagePost(post)}
								onToggleLike={() =>
									setLiked((prev) => ({
										...prev,
										[post.id]: !isLiked,
									}))
								}
								onToggleRepost={() =>
									setReposted((prev) => ({
										...prev,
										[post.id]: !isReposted,
									}))
								}
								onToggleBookmark={() =>
									setBookmarked((prev) => ({
										...prev,
										[post.id]: !isBookmarked,
									}))
								}
								onToggleExpand={() =>
									setExpanded((prev) => ({
										...prev,
										[post.id]: !isExpanded,
									}))
								}
								onShare={() => handleShare(post)}
								onEdit={() => {
									setEditTarget(post);
									setIsEditOpen(true);
								}}
								onDelete={() => handleDeletePost(post)}
							/>
						);
					})}
				</div>
			)}

			<PhotoboardCreateModal
				isOpen={composerOpen}
				onOpenChange={setComposerOpen}
				onSubmit={(newPost) => {
					setPosts((prev) => [newPost, ...prev]);
					toast.success("새 게시물이 추가되었습니다.");
				}}
			/>
			<PhotoboardCreateModal
				isOpen={isEditOpen}
				onOpenChange={(open) => {
					setIsEditOpen(open);
					if (!open) {
						setEditTarget(null);
					}
				}}
				mode="edit"
				post={editTarget}
				onSubmit={(updatedPost) => {
					setPosts((prev) =>
						prev.map((item) =>
							item.id === updatedPost.id ? updatedPost : item
						)
					);
					setEditTarget(updatedPost);
					toast.success("게시물이 수정되었습니다.");
				}}
			/>
		</div>
	);
}
