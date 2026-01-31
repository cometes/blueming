"use client";

import { useEffect } from "react";

const CSS_VAR_NAME = "--keyboard-height";

/**
 * 모바일 키보드 높이를 CSS 변수로 설정하는 훅
 * React 리렌더링 없이 CSS 변수만 업데이트
 */
export function useKeyboardHeight(): void {
	useEffect(() => {
		if (typeof window === "undefined") return;

		const vv = window.visualViewport;
		if (!vv) return;

		let rafId: number | null = null;
		let lastHeight = -1;

		const updateCssVar = () => {
			rafId = null;
			const height = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

			if (height !== lastHeight) {
				document.documentElement.style.setProperty(CSS_VAR_NAME, `${height}px`);
				lastHeight = height;
			}
		};

		const handleViewportChange = () => {
			if (rafId !== null) return;
			rafId = requestAnimationFrame(updateCssVar);
		};

		// 초기값 설정
		updateCssVar();

		vv.addEventListener("resize", handleViewportChange);
		vv.addEventListener("scroll", handleViewportChange);

		return () => {
			vv.removeEventListener("resize", handleViewportChange);
			vv.removeEventListener("scroll", handleViewportChange);
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
			// 정리 시 CSS 변수 제거
			document.documentElement.style.removeProperty(CSS_VAR_NAME);
		};
	}, []);
}
