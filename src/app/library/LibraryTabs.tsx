"use client";

import { cn } from "@/shared/lib/utils";

interface LibraryTabsProps {
	isSeriesOn: boolean;
	onSelect: (isSeriesOn: boolean) => void;
}

/** 글 / 시리즈 탭 전환 UI */
export default function LibraryTabs({ isSeriesOn, onSelect }: LibraryTabsProps) {
	return (
		<div className="TabWrap w-fit mx-auto mt-2.5 sm:mt-7">
			<div className="TabBox flex justify-center">
				{/* 비활성 탭은 색 대신 투명도로 구분 — 테마에서 sub-text와
				    theme-primary가 같은 색이어도 활성 탭이 확실히 구분된다 */}
				<button
					className={cn(
						"Tab block font-medium bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer font-title transition-[color,opacity]",
						isSeriesOn
							? "text-sub-text opacity-40 hover:opacity-70"
							: "text-theme-primary",
					)}
					onClick={() => onSelect(false)}
				>
					글
				</button>
				<button
					className={cn(
						"Tab block font-medium bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer font-title transition-[color,opacity]",
						isSeriesOn
							? "text-theme-primary"
							: "text-sub-text opacity-40 hover:opacity-70",
					)}
					onClick={() => onSelect(true)}
				>
					시리즈
				</button>
			</div>
			{/* 트랙은 흐리게, 활성 인디케이터는 theme-primary로 좌우 슬라이드 —
			    테마에서 sub-text와 theme-primary가 같은 색이어도 구분된다 */}
			<div className="relative h-0.5 bg-sub-text/25">
				<div
					className={cn(
						"absolute left-0 top-0 h-0.5 w-1/2 bg-theme-primary transition-transform duration-300 ease-in-out",
						isSeriesOn ? "translate-x-full" : "translate-x-0",
					)}
				/>
			</div>
		</div>
	);
}
