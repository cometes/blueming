"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth/store";
import { fetchUnreadCount } from "@/features/notification/api/client";
import { useNotificationStore } from "@/features/notification/store/useNotificationStore";

const POLL_INTERVAL_MS = 60 * 1000;
/** 알림 변경(읽음/삭제) 시 탭 간 뱃지 동기화 채널 */
export const NOTIFICATION_CHANNEL = "notificationsRefetch";

/**
 * 미읽음 알림 수 폴링 (앱 전역 1개 — Providers에 마운트).
 * 탭이 숨겨지면 폴링을 멈추고, 다시 보이면 즉시 1회 조회 후 재개한다.
 * (WidgetWeatherClock의 폴링 패턴)
 */
export default function NotificationPoller() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

	useEffect(() => {
		if (!isAuthenticated) {
			setUnreadCount(0);
			return;
		}

		let timer: ReturnType<typeof setInterval> | null = null;
		let cancelled = false;

		const poll = async () => {
			try {
				const count = await fetchUnreadCount();
				if (!cancelled) setUnreadCount(count);
			} catch {
				// 폴링 실패는 조용히 무시 (다음 주기에 재시도)
			}
		};

		const start = () => {
			if (timer) return;
			void poll();
			timer = setInterval(poll, POLL_INTERVAL_MS);
		};
		const stop = () => {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
		};

		const onVisibilityChange = () => {
			if (document.hidden) {
				stop();
			} else {
				start();
			}
		};

		const channel = new BroadcastChannel(NOTIFICATION_CHANNEL);
		channel.onmessage = () => void poll();

		start();
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			cancelled = true;
			stop();
			document.removeEventListener("visibilitychange", onVisibilityChange);
			channel.close();
		};
	}, [isAuthenticated, setUnreadCount]);

	return null;
}
