import { create } from "zustand";
import type { NotificationItem } from "@/features/notification/types";

interface NotificationState {
	unreadCount: number;
	items: NotificationItem[];
	/** 목록을 한 번이라도 불러왔는지 (패널 첫 오픈 로딩 표시용) */
	loaded: boolean;
	setUnreadCount: (count: number) => void;
	setItems: (items: NotificationItem[], unreadCount: number) => void;
	markReadLocal: (ids: string[]) => void;
	markAllReadLocal: () => void;
	clearAllLocal: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
	unreadCount: 0,
	items: [],
	loaded: false,
	setUnreadCount: (count) => set({ unreadCount: count }),
	setItems: (items, unreadCount) => set({ items, unreadCount, loaded: true }),
	markReadLocal: (ids) =>
		set((state) => {
			const idSet = new Set(ids);
			const items = state.items.map((item) =>
				idSet.has(item.id) ? { ...item, read: true } : item,
			);
			const marked = state.items.filter(
				(item) => idSet.has(item.id) && !item.read,
			).length;
			return { items, unreadCount: Math.max(0, state.unreadCount - marked) };
		}),
	markAllReadLocal: () =>
		set((state) => ({
			items: state.items.map((item) => ({ ...item, read: true })),
			unreadCount: 0,
		})),
	clearAllLocal: () => set({ items: [], unreadCount: 0 }),
}));
