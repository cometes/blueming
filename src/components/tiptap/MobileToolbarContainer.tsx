"use client";

import * as React from "react";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { cn } from "@/shared/lib/utils";

interface MobileToolbarContainerProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * 모바일에서 키보드 상단에 고정되는 툴바 컨테이너
 * - CSS 변수를 통해 키보드 높이 반영 (리렌더링 없음)
 * - safe-area-inset-bottom 적용
 */
export function MobileToolbarContainer({
	children,
	className,
}: MobileToolbarContainerProps) {
	// CSS 변수 --keyboard-height 설정 (리렌더링 없이 DOM 직접 조작)
	useKeyboardHeight();

	return (
		<div
			className={cn(
				"fixed left-0 right-0 z-50 bg-card border-t border-card-border backdrop-blur-card sm:hidden",
				"bottom-[calc(env(safe-area-inset-bottom,0px)+var(--keyboard-height,0px))]",
				className,
			)}
		>
			{children}
		</div>
	);
}
