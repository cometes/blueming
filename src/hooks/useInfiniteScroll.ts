"use client";

import { useEffect, useRef } from "react";

/**
 * IntersectionObserver 기반 무한스크롤.
 * 반환된 ref를 목록 하단 sentinel 요소에 달면, 뷰포트 400px 전방에서
 * onLoadMore가 호출된다. hasMore/isLoading 가드는 호출측 상태로 제어.
 * (IntersectionObserver 미지원 환경은 호출측의 "더보기" 버튼 폴백 사용)
 */
export function useInfiniteScroll({
	hasMore,
	isLoading,
	onLoadMore,
}: {
	hasMore: boolean;
	isLoading: boolean;
	onLoadMore: () => void;
}) {
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const callbackRef = useRef(onLoadMore);
	callbackRef.current = onLoadMore;

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !hasMore || isLoading) return;
		if (typeof IntersectionObserver === "undefined") return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					callbackRef.current();
				}
			},
			{ rootMargin: "400px 0px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, isLoading]);

	return sentinelRef;
}
