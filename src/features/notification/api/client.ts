import { httpClient } from "@/shared/lib/http/client";
import type { NotificationListResponse } from "@/features/notification/types";

export const fetchNotifications = async (): Promise<NotificationListResponse> => {
	const response = await httpClient.get<NotificationListResponse>("/notifications");
	return response.data;
};

export const fetchUnreadCount = async (): Promise<number> => {
	const response = await httpClient.get<{ unreadCount: number }>(
		"/notifications",
		{ params: { countOnly: 1 } },
	);
	return response.data.unreadCount;
};

export const markNotificationsRead = async (target: {
	ids?: string[];
	all?: boolean;
}): Promise<void> => {
	await httpClient.patch("/notifications", target);
};

export const deleteNotifications = async (target: {
	ids?: string[];
	all?: boolean;
}): Promise<void> => {
	// httpClient.delete는 body를 받지 않아 raw fetch 사용
	const res = await fetch("/api/notifications", {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(target),
	});
	if (!res.ok) throw new Error("알림 삭제에 실패했습니다.");
};
