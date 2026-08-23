export type NotificationCategory = "comment" | "mention" | "activity";

export interface NotificationItem {
	id: string;
	type: string;
	category: NotificationCategory;
	message: string;
	excerpt: string;
	link: string;
	actor: {
		uid: string | null;
		name: string;
		avatarUrl: string;
		anon: boolean;
	} | null;
	read: boolean;
	createdAt: string | null;
}

export interface NotificationListResponse {
	items: NotificationItem[];
	unreadCount: number;
}
