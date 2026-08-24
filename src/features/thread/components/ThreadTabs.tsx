"use client";

import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { ThreadTab } from "@/features/thread/types";

// "전체" 탭은 제거 — 이 자리에 추후 "마음에 들어요"(좋아요 모아보기) 탭 예정
const TABS: Array<{ value: ThreadTab; label: string; requiresAuth?: boolean }> = [
	{ value: "roots", label: "홈" },
	{ value: "mine", label: "내 글", requiresAuth: true },
];

interface ThreadTabsProps {
	tab: ThreadTab;
	tag: string;
	isAuthenticated: boolean;
	onSelectTab: (tab: ThreadTab) => void;
}

/** 트위터식 탭 바 — 균등 폭 + 활성 탭 하단 라운드 인디케이터. 홈=루트 글만, 전체=답글 포함 */
export default function ThreadTabs({
	tab,
	tag,
	isAuthenticated,
	onSelectTab,
}: ThreadTabsProps) {
	return (
		<div className="flex items-stretch border-b border-card-border">
			{TABS.filter((t) => !t.requiresAuth || isAuthenticated).map((t) => (
				<button
					key={t.value}
					type="button"
					onClick={() => onSelectTab(t.value)}
					className="flex-1 hover:bg-card-bg/50"
				>
					<span
						className={cn(
							"relative mx-auto inline-flex flex-col items-center px-1 pb-3 pt-3.5 text-sm font-title",
							tab === t.value
								? "font-semibold text-main-text"
								: "text-sub-text opacity-70 hover:opacity-100",
						)}
					>
						{t.label}
						<span
							className={cn(
								"absolute bottom-0 h-1 w-full min-w-9 rounded-full",
								tab === t.value ? "bg-theme-primary" : "bg-transparent",
							)}
						/>
					</span>
				</button>
			))}
			{tab === "tag" && tag && (
				<div className="flex items-center pr-3">
					<button
						type="button"
						onClick={() => onSelectTab("roots")}
						className="flex items-center gap-1 rounded-full border border-theme-primary/50 bg-theme-primary/10 px-2.5 py-1 text-xs text-theme-primary"
					>
						#{tag}
						<X size={11} />
					</button>
				</div>
			)}
		</div>
	);
}
