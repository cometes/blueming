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
} from "@/features/photoboard/api/client";
import PhotoboardSettingsDialog from "@/components/modal/PhotoboardSettingsDialog";
import AdminOnly from "@/components/common/AdminOnly";
import { useSettings } from "@/contexts/SettingsContext";
import { setSettingsMainPhotoboard } from "@/features/settings/api/main";
import { useAuthStore } from "@/store/auth/store";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import PhotoboardItem from "@/components/items/PhotoboardItem";
import PhotoboardDetailModal from "@/components/modal/PhotoboardDetailModal";

interface PhotoBoardClientProps {
	initialPosts: PhotoBoardPost[];
}

export default function PhotoBoardClient({
	initialPosts,
}: PhotoBoardClientProps) {
	const { main, updateMain, refreshSettings } = useSettings();
	const { user } = useAuthStore();
	const { isAdmin, isManagerOrAdmin, isAuthenticated } = useAdmin();
	const [liked, setLiked] = useState<Record<string, boolean>>({});
	const [reposted, setReposted] = useState<Record<string, boolean>>({});
	const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const [posts, setPosts] = useState<PhotoBoardPost[]>(initialPosts);
	const [composerOpen, setComposerOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(initialPosts.length === 0);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<PhotoBoardPost | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const [appliedQuery, setAppliedQuery] = useState("");
	const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

	const defaultPhotoboardSettings = useMemo(
		() => ({
			postsPerRow: 3,
			writePermission: "member" as const,
		}),
		[],
	);

	const resolvedPhotoboardSettings = useMemo(
		() => ({
			...defaultPhotoboardSettings,
			...(main?.photoboard || {}),
		}),
		[defaultPhotoboardSettings, main],
	);

	const [postsPerRow, setPostsPerRow] = useState(
		resolvedPhotoboardSettings.postsPerRow,
	);
	const [writePermission, setWritePermission] = useState<
		"admin" | "manager" | "member"
	>(resolvedPhotoboardSettings.writePermission);

	const [tempPostsPerRow, setTempPostsPerRow] = useState(postsPerRow);
	const [tempWritePermission, setTempWritePermission] =
		useState(writePermission);

	// 상태 업데이트 최적화: 값이 변경될 때만 업데이트
	useEffect(() => {
		const { postsPerRow: newRows, writePermission: newPermission } =
			resolvedPhotoboardSettings;

		setPostsPerRow((prev) => (newRows !== prev ? newRows : prev));
		setWritePermission((prev) =>
			newPermission !== prev ? newPermission : prev,
		);
	}, [resolvedPhotoboardSettings]);

	useEffect(() => {
		if (isDialogOpen) {
			setTempPostsPerRow(postsPerRow);
			setTempWritePermission(writePermission);
		}
	}, [isDialogOpen, postsPerRow, writePermission]);

	useEffect(() => {
		setPosts(initialPosts);
		if (initialPosts.length > 0) {
			setIsLoading(false);
			return;
		}

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
	}, [initialPosts]);

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

	const clampedPostsPerRow = Math.min(Math.max(postsPerRow, 1), 5);
	const columnsClass =
		{
			1: "columns-1 sm:columns-1 md:columns-1 lg:columns-1",
			2: "columns-1 sm:columns-2 md:columns-2 lg:columns-2",
			3: "columns-1 sm:columns-2 md:columns-3 lg:columns-3",
			4: "columns-1 sm:columns-2 md:columns-3 lg:columns-4",
			5: "columns-1 sm:columns-2 md:columns-3 lg:columns-5",
		}[clampedPostsPerRow] ?? "columns-1 sm:columns-2 md:columns-2 lg:columns-3";

	const canManagePost = (post: PhotoBoardPost) =>
		Boolean(isAdmin || (user && post.author?.id === user.uid));

	const normalizedQuery = appliedQuery.trim().toLowerCase();
	const filteredPosts = useMemo(() => {
		if (!normalizedQuery) return posts;
		return posts.filter((post) => {
			const tags = Array.isArray(post.tags) ? post.tags.join(" ") : "";
			const haystack = [post.caption, post.author?.name ?? "", tags]
				.join(" ")
				.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [posts, normalizedQuery]);

	// Detail Modal Handlers
	const handlePostClick = (post: PhotoBoardPost) => {
		setSelectedPostId(post.id);
		// Add hash to URL for sharing/navigation support if desired, but for now just state
		// window.history.pushState(null, "", `#${post.id}`);
	};

	const handleCloseDetail = () => {
		setSelectedPostId(null);
		// window.history.pushState(null, "", " ");
	};

	const selectedPostIndex = useMemo(() => {
		if (!selectedPostId) return -1;
		return filteredPosts.findIndex((p) => p.id === selectedPostId);
	}, [selectedPostId, filteredPosts]);

	const selectedPost =
		selectedPostIndex >= 0 ? filteredPosts[selectedPostIndex] : null;

	const handleNextPost = () => {
		if (
			selectedPostIndex >= 0 &&
			selectedPostIndex < filteredPosts.length - 1
		) {
			setSelectedPostId(filteredPosts[selectedPostIndex + 1].id);
		}
	};

	const handlePrevPost = () => {
		if (selectedPostIndex > 0) {
			setSelectedPostId(filteredPosts[selectedPostIndex - 1].id);
		}
	};

	const handleDeletePost = async (post: PhotoBoardPost) => {
		const confirmed = window.confirm(
			"게시글을 삭제할까요? 이 작업은 되돌릴 수 없어요.",
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

	const canWrite =
		writePermission === "admin"
			? isAdmin
			: writePermission === "manager"
				? isManagerOrAdmin
				: isAuthenticated;

	return (
		<div className="w-full max-w-full md:max-w-2xl mt-[90px] mb-[40px] mx-auto md:px-0">
			<header className="mb-10 flex items-center justify-center">
				<div className="flex items-center justify-center gap-2 w-full sm:w-auto">
					{writePermission === "admin" && isAdmin ? (
						<div className="w-[150px]"></div>
					) : null}

					<div className="w-[200px]">
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
							showManagerOption
							onSave={handleSaveSettings}
							trigger={
								<Button className="bg-card border-card text-main-text rounded-full w-10 h-10 hover:border-transparent">
									<Settings />
								</Button>
							}
						/>
					</AdminOnly>
					{canWrite ? (
						<Button
							type="button"
							onClick={() => setComposerOpen(true)}
							className="gap-2 bg-theme-primary text-white hover:bg-theme-primary/90"
						>
							<Plus size={16} />새 글쓰기
						</Button>
					) : null}
				</div>
			</header>

			{isLoading ? null : filteredPosts.length === 0 ? (
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

						return (
							<PhotoboardItem
								key={post.id}
								post={post}
								isLiked={isLiked}
								isReposted={isReposted}
								isBookmarked={isBookmarked}
								isExpanded={isExpanded}
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
								onClick={() => handlePostClick(post)}
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
							item.id === updatedPost.id ? updatedPost : item,
						),
					);
					setEditTarget(updatedPost);
					toast.success("게시물이 수정되었습니다.");
				}}
			/>
			<PhotoboardDetailModal
				post={selectedPost}
				isOpen={!!selectedPostId}
				onClose={handleCloseDetail}
				onNext={handleNextPost}
				onPrev={handlePrevPost}
				hasNext={
					selectedPostIndex >= 0 && selectedPostIndex < filteredPosts.length - 1
				}
				hasPrev={selectedPostIndex > 0}
			/>
		</div>
	);
}
