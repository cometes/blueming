"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * 라이브러리 목록의 뷰 상태: 글/시리즈 탭(URL ?tab= 동기화)과 카드 뷰 토글(쿠키 저장).
 */
export function useLibraryViewState(initialIsCardOn?: boolean) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isSeriesOn, setIsSeriesOn] = useState(false);
	const [isCardOn, setIsCardOn] = useState(initialIsCardOn ?? false);

	const updateTabParam = (nextIsSeriesOn: boolean) => {
		const params = new URLSearchParams(searchParams.toString());
		if (nextIsSeriesOn) {
			params.set("tab", "series");
		} else {
			params.delete("tab");
		}
		const query = params.toString();
		router.replace(query ? `${pathname}?${query}` : pathname, {
			scroll: false,
		});
	};

	// URL 쿼리에서 탭 상태 복원
	useEffect(() => {
		const tab = searchParams.get("tab");
		setIsSeriesOn(tab === "series");
	}, [searchParams]);

	// 카드 뷰 상태 변경 시 쿠키에 저장 (SSR 초기값 복원용)
	useEffect(() => {
		document.cookie = `library_card_on=${isCardOn}; path=/; max-age=31536000`;
	}, [isCardOn]);

	const selectTab = (nextIsSeriesOn: boolean) => {
		setIsSeriesOn(nextIsSeriesOn);
		updateTabParam(nextIsSeriesOn);
	};

	const selectView = (nextIsCardOn: boolean) => {
		setIsCardOn(nextIsCardOn);
		setIsSeriesOn(false);
		updateTabParam(false);
	};

	return {
		isSeriesOn,
		isCardOn,
		selectTab,
		selectView,
	};
}
