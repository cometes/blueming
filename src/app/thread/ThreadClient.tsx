"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth/store";
import { useThreadFeed } from "@/features/thread/hooks/useThreadFeed";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ThreadPostCard from "@/features/thread/components/ThreadPostCard";
import ThreadComposer from "@/features/thread/components/ThreadComposer";
import ThreadTabs from "@/features/thread/components/ThreadTabs";
import ImageSlideModal from "@/components/modal/ImageSlideModal";
import { Button } from "@/components/ui/button";
import type { ThreadFeedResponse } from "@/features/thread/types";

interface ThreadClientProps {
	initialData: ThreadFeedResponse;
}

export default function ThreadClient({ initialData }: ThreadClientProps) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
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

	return (
		<div className="w-full max-w-xl mx-auto mt-[90px] mb-[40px]">
			<section className="bg-card rounded-card border-card backdrop-blur-card overflow-hidden">
				<header className="px-4 pt-4 pb-1">
					<h1 className="text-[20px] font-semibold font-title text-main-text">
						스레드
					</h1>
				</header>

				<ThreadTabs
					tab={tab}
					tag={tag}
					isAuthenticated={isAuthenticated}
					onSelectTab={selectTab}
				/>

				{isAuthenticated && <ThreadComposer onPosted={prependPost} />}

				{items.length === 0 && !isLoading ? (
					<div className="py-16 text-center text-sm text-sub-text">
						{tab === "tag"
							? "이 태그의 글이 없습니다."
							: "아직 글이 없습니다. 첫 글을 남겨보세요!"}
					</div>
				) : (
					items.map((post) => (
						<ThreadPostCard
							key={post.id}
							post={post}
							onSelectTag={selectTag}
							onOpenImage={(urls, index) => setImageModal({ urls, index })}
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
