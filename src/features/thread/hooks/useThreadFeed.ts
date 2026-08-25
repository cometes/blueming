"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { fetchThreadFeed } from "@/features/thread/api/client";
import type {
	ThreadFeedResponse,
	ThreadPost,
	ThreadTab,
} from "@/features/thread/types";

/**
 * 스레드 피드 상태: 탭/태그 전환, 커서 페이징 append, 새 글 prepend.
 * initialData는 RSC(serverDirect)가 넣어준 홈(루트만) 탭 첫 페이지.
 */
export function useThreadFeed(initialData: ThreadFeedResponse) {
	const [tab, setTab] = useState<ThreadTab>("roots");
	const [tag, setTag] = useState("");
	const [items, setItems] = useState<ThreadPost[]>(initialData.items);
	const [nextCursor, setNextCursor] = useState<string | null>(
		initialData.nextCursor,
	);
	const [isLoading, setIsLoading] = useState(false);
	// 첫 마운트에서는 initialData(홈 탭)를 그대로 사용
	const skipInitialLoadRef = useRef(true);
	const requestSeqRef = useRef(0);

	const load = useCallback(
		async (options: {
			tab: ThreadTab;
			tag: string;
			cursor: string | null;
			append: boolean;
		}) => {
			const seq = ++requestSeqRef.current;
			setIsLoading(true);
			try {
				const data = await fetchThreadFeed({
					tab: options.tab,
					tag: options.tag || undefined,
					cursor: options.cursor,
				});
				if (seq !== requestSeqRef.current) return; // 탭 전환 경합 무시
				setItems((prev) =>
					options.append ? [...prev, ...data.items] : data.items,
				);
				setNextCursor(data.nextCursor);
			} catch (error) {
				if (seq === requestSeqRef.current) {
					toast.error(
						error instanceof Error
							? error.message
							: "스레드를 불러오지 못했습니다.",
					);
				}
			} finally {
				if (seq === requestSeqRef.current) setIsLoading(false);
			}
		},
		[],
	);

	// 탭/태그 변경 시 새로 로드
	useEffect(() => {
		if (skipInitialLoadRef.current) {
			skipInitialLoadRef.current = false;
			return;
		}
		void load({ tab, tag, cursor: null, append: false });
	}, [tab, tag, load]);

	const loadMore = useCallback(() => {
		if (!nextCursor || isLoading) return;
		void load({ tab, tag, cursor: nextCursor, append: true });
	}, [load, tab, tag, nextCursor, isLoading]);

	const selectTab = useCallback((nextTab: ThreadTab) => {
		setTab(nextTab);
		if (nextTab !== "tag") setTag("");
	}, []);

	const selectTag = useCallback((nextTag: string) => {
		setTag(nextTag);
		setTab("tag");
	}, []);

	const prependPost = useCallback((post: ThreadPost) => {
		setItems((prev) => [post, ...prev]);
	}, []);

	/** 특정 글(타래 미리보기 포함)을 부분 갱신 — 좋아요 옵티미스틱 반영용 */
	const updatePost = useCallback(
		(id: string, updater: (post: ThreadPost) => ThreadPost) => {
			setItems((prev) =>
				prev.map((item) => {
					const next = item.id === id ? updater(item) : item;
					if (!next.previewReplies?.some((reply) => reply.id === id)) {
						return next;
					}
					return {
						...next,
						previewReplies: next.previewReplies.map((reply) =>
							reply.id === id ? updater(reply) : reply,
						),
					};
				}),
			);
		},
		[],
	);

	return {
		tab,
		tag,
		items,
		isLoading,
		hasMore: nextCursor !== null,
		loadMore,
		selectTab,
		selectTag,
		prependPost,
		updatePost,
	};
}
