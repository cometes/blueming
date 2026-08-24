"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth/store";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import { useThreadFeed } from "@/features/thread/hooks/useThreadFeed";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ThreadConversation from "@/features/thread/components/ThreadConversation";
import ThreadComposer from "@/features/thread/components/ThreadComposer";
import ThreadTabs from "@/features/thread/components/ThreadTabs";
import ImageSlideModal from "@/components/modal/ImageSlideModal";
import PhotoboardSettingsDialog from "@/features/photoboard/components/PhotoboardSettingsDialog";
import AdminOnly from "@/components/common/AdminOnly";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { setSettingsMainThreads } from "@/features/settings/api/main";
import type { ThreadFeedResponse, ThreadPost } from "@/features/thread/types";

type ThreadWritePermission = "admin" | "manager" | "member";

interface ThreadClientProps {
	initialData: ThreadFeedResponse;
}

export default function ThreadClient({ initialData }: ThreadClientProps) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const { isAdmin, isManagerOrAdmin } = useAdmin();
	const {
		tab,
		tag,
		items,
		isLoading,
		hasMore,
		loadMore,
		selectTab,
		selectTag,
		prependPost,
	} = useThreadFeed(initialData);
	const sentinelRef = useInfiniteScroll({ hasMore, isLoading, onLoadMore: loadMore });

	const [imageModal, setImageModal] = useState<{
		urls: string[];
		index: number;
	} | null>(null);
	const [quoteTarget, setQuoteTarget] = useState<ThreadPost | null>(null);

	// 작성 권한 설정 (관리자 다이얼로그) — 저장은 서버 검증(requireManager)
	const { main, updateMain, refreshSettings } = useSettings();
	const writePermission: ThreadWritePermission =
		main?.threads?.writePermission ?? "member";
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [tempWritePermission, setTempWritePermission] =
		useState<ThreadWritePermission>(writePermission);

	useEffect(() => {
		if (isSettingsOpen) setTempWritePermission(writePermission);
	}, [isSettingsOpen, writePermission]);

	// 클라 표시용 작성 가능 여부 (서버가 최종 검증)
	const canWrite =
		writePermission === "admin"
			? isAdmin
			: writePermission === "manager"
				? isManagerOrAdmin
				: isAuthenticated;

	const handleSaveSettings = useCallback(async () => {
		try {
			const payload = { writePermission: tempWritePermission };
			await setSettingsMainThreads(payload);
			updateMain?.({ threads: payload });
			await refreshSettings?.({ broadcast: true });
			setIsSettingsOpen(false);
			toast.success("저장되었습니다.");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "저장에 실패했습니다.",
			);
		}
	}, [tempWritePermission, updateMain, refreshSettings]);

	// 인용 버튼 → 상단 컴포저에 인용 카드 부착 + 스크롤
	const handleQuote = useCallback((post: ThreadPost) => {
		setQuoteTarget(post);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	return (
		<div className="w-full max-w-xl mx-auto mt-[90px] mb-[40px]">
			<section className="bg-card rounded-card border-card backdrop-blur-card overflow-hidden">
				<header className="flex items-center justify-between px-4 pt-4 pb-1">
					<h1 className="text-[20px] font-semibold font-title text-main-text">
						스레드
					</h1>
					<AdminOnly>
						<PhotoboardSettingsDialog
							isOpen={isSettingsOpen}
							onOpenChange={setIsSettingsOpen}
							tempWritePermission={tempWritePermission}
							setTempWritePermission={setTempWritePermission}
							showManagerOption
							title="스레드 페이지 설정"
							onSave={handleSaveSettings}
							trigger={
								<Button
									variant="ghost"
									size="icon"
									aria-label="스레드 설정"
									className="h-8 w-8 rounded-card border border-card bg-card-bg text-sub-text hover:text-theme-primary"
								>
									<Settings size={15} />
								</Button>
							}
						/>
					</AdminOnly>
				</header>

				<ThreadTabs
					tab={tab}
					tag={tag}
					isAuthenticated={isAuthenticated}
					onSelectTab={selectTab}
				/>

				{canWrite && (
					<ThreadComposer
						onPosted={prependPost}
						quoteTarget={quoteTarget}
						onClearQuote={() => setQuoteTarget(null)}
					/>
				)}

				{items.length === 0 && !isLoading ? (
					<div className="py-16 text-center text-sm text-sub-text">
						{tab === "tag"
							? "이 태그의 글이 없습니다."
							: "아직 글이 없습니다. 첫 글을 남겨보세요!"}
					</div>
				) : (
					items.map((post) => (
						<ThreadConversation
							key={post.id}
							post={post}
							onSelectTag={selectTag}
							onOpenImage={(urls, index) => setImageModal({ urls, index })}
							onQuote={canWrite ? handleQuote : undefined}
						/>
					))
				)}

				{isLoading && (
					<div className="py-6 text-center text-xs text-sub-text">
						불러오는 중...
					</div>
				)}

				{/* 무한스크롤 sentinel + 폴백 더보기 버튼 */}
				<div ref={sentinelRef} />
				{hasMore && !isLoading && (
					<div className="py-4 text-center">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={loadMore}
							className="rounded-card border border-card bg-card-bg text-xs text-sub-text"
						>
							더 보기
						</Button>
					</div>
				)}
			</section>

			{imageModal && (
				<ImageSlideModal
					isOpen
					onOpenChange={(open) => {
						if (!open) setImageModal(null);
					}}
					images={imageModal.urls}
					initialIndex={imageModal.index}
				/>
			)}
		</div>
	);
}
