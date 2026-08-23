"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import {
	deleteNotifications,
	fetchNotifications,
	markNotificationsRead,
} from "@/features/notification/api/client";
import { useNotificationStore } from "@/features/notification/store/useNotificationStore";
import { NOTIFICATION_CHANNEL } from "@/features/notification/components/NotificationPoller";
import type { NotificationItem } from "@/features/notification/types";

type PanelTab = "all" | "comment" | "mention";

const TABS: Array<{ value: PanelTab; label: string }> = [
	{ value: "all", label: "전체" },
	{ value: "comment", label: "댓글" },
	{ value: "mention", label: "멘션" },
];

const timeAgo = (iso: string | null) => {
	if (!iso) return "";
	const diffMs = Date.now() - new Date(iso).getTime();
	const minutes = Math.floor(diffMs / 60_000);
	if (minutes < 1) return "방금 전";
	if (minutes < 60) return `${minutes}분 전`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}시간 전`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}일 전`;
	return new Date(iso).toLocaleDateString("ko-KR");
};

const broadcastRefetch = () => {
	const channel = new BroadcastChannel(NOTIFICATION_CHANNEL);
	channel.postMessage({ timestamp: Date.now() });
	channel.close();
};

/** 알림 패널 본문 — NotificationBell의 드롭다운 내용으로 렌더된다. */
export default function NotificationPanel({
	onNavigate,
}: {
	/** 항목 클릭으로 이동할 때 패널을 닫기 위한 콜백 */
	onNavigate?: () => void;
}) {
	const router = useRouter();
	const [tab, setTab] = useState<PanelTab>("all");
	const [loading, setLoading] = useState(false);
	const { items, loaded, setItems, markReadLocal, markAllReadLocal, clearAllLocal } =
		useNotificationStore();

	// 패널이 열릴 때(마운트 시) 목록 로드
	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			setLoading(true);
			try {
				const data = await fetchNotifications();
				if (!cancelled) setItems(data.items, data.unreadCount);
			} catch {
				if (!cancelled) toast.error("알림을 불러오지 못했습니다.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, [setItems]);

	const filtered = useMemo(
		() => (tab === "all" ? items : items.filter((item) => item.category === tab)),
		[items, tab],
	);

	const handleItemClick = async (item: NotificationItem) => {
		if (!item.read) {
			markReadLocal([item.id]);
			try {
				await markNotificationsRead({ ids: [item.id] });
				broadcastRefetch();
			} catch {
				// 읽음 실패는 비치명
			}
		}
		onNavigate?.();
		router.push(item.link || "/");
	};

	const handleMarkAllRead = async () => {
		markAllReadLocal();
		try {
			await markNotificationsRead({ all: true });
			broadcastRefetch();
		} catch {
			toast.error("읽음 처리에 실패했습니다.");
		}
	};

	const handleDeleteAll = async () => {
		clearAllLocal();
		try {
			await deleteNotifications({ all: true });
			broadcastRefetch();
		} catch {
			toast.error("알림 삭제에 실패했습니다.");
		}
	};

	return (
		<div className="w-80 max-w-[calc(100vw-2rem)]">
			<div className="flex items-center justify-between px-3 pt-2">
				<span className="text-sm font-semibold text-main-text font-title">알림</span>
			</div>
			<div className="flex items-center justify-between border-b border-card px-3">
				<div className="flex gap-3">
					{TABS.map(({ value, label }) => (
						<button
							key={value}
							type="button"
							onClick={() => setTab(value)}
							className={cn(
								"py-2 text-xs border-b-2 -mb-px",
								tab === value
									? "border-theme-primary text-theme-primary font-medium"
									: "border-transparent text-sub-text hover:text-main-text",
							)}
						>
							{label}
						</button>
					))}
				</div>
				<div className="flex gap-2 text-[11px] text-sub-text">
					<button
						type="button"
						onClick={() => void handleDeleteAll()}
						className="hover:text-red-400"
					>
						모두 삭제
					</button>
					<button
						type="button"
						onClick={() => void handleMarkAllRead()}
						className="hover:text-theme-primary"
					>
						모두 읽음
					</button>
				</div>
			</div>

			<div className="max-h-96 overflow-y-auto">
				{loading && !loaded ? (
					<div className="py-10 text-center text-xs text-sub-text">
						불러오는 중...
					</div>
				) : filtered.length === 0 ? (
					<div className="py-10 text-center text-xs text-sub-text">
						알림이 없습니다.
					</div>
				) : (
					<ul>
						{filtered.map((item) => (
							<li key={item.id}>
								<button
									type="button"
									onClick={() => void handleItemClick(item)}
									className={cn(
										"flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-theme-primary/10",
										!item.read && "bg-theme-primary/5",
									)}
								>
									<span className="mt-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-card-bg border border-card flex items-center justify-center text-[11px] text-sub-text">
										{item.actor?.avatarUrl ? (
											<img
												src={item.actor.avatarUrl}
												alt=""
												className="h-full w-full object-cover"
											/>
										) : (
											(item.actor?.name || "?").charAt(0)
										)}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block text-xs text-main-text leading-snug">
											{item.message}
										</span>
										{item.excerpt ? (
											<span className="mt-0.5 block truncate text-[11px] text-sub-text">
												{item.excerpt}
											</span>
										) : null}
										<span className="mt-0.5 block text-[10px] text-sub-text/70">
											{timeAgo(item.createdAt)}
										</span>
									</span>
									{!item.read && (
										<span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-theme-primary" />
									)}
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
