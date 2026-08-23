"use client";

import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { ThreadTab } from "@/features/thread/types";

const TABS: Array<{ value: ThreadTab; label: string; requiresAuth?: boolean }> = [
	{ value: "all", label: "전체" },
	{ value: "roots", label: "메인 글만" },
	{ value: "mine", label: "내 글", requiresAuth: true },
];

interface ThreadTabsProps {
	tab: ThreadTab;
	tag: string;
	isAuthenticated: boolean;
	onSelectTab: (tab: ThreadTab) => void;
}

export default function ThreadTabs({
	tab,
	tag,
	isAuthenticated,
	onSelectTab,
}: ThreadTabsProps) {
	return (
		<div className="flex items-center gap-1 border-b border-card-border px-2">
			{TABS.filter((t) => !t.requiresAuth || isAuthenticated).map((t) => (
				<button
					key={t.value}
					type="button"
					onClick={() => onSelectTab(t.value)}
					className={cn(
						"px-3 py-2.5 text-sm border-b-2 -mb-px font-title",
						tab === t.value
							? "border-theme-primary text-theme-primary font-medium"
							: "border-transparent text-sub-text opacity-60 hover:opacity-100",
					)}
				>
					{t.label}
				</button>
			))}
			{tab === "tag" && tag && (
				<button
					type="button"
					onClick={() => onSelectTab("all")}
					className="ml-1 flex items-center gap-1 rounded-full border border-theme-primary/50 bg-theme-primary/10 px-2.5 py-1 text-xs text-theme-primary"
				>
					#{tag}
					<X size={11} />
				</button>
			)}
		</div>
	);
}
