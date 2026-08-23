"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/store/auth/store";
import { useNotificationStore } from "@/features/notification/store/useNotificationStore";
import NotificationPanel from "@/features/notification/components/NotificationPanel";

type BellVariant = "iconbar" | "desktop" | "mobile";

interface NotificationBellProps {
	variant?: BellVariant;
	/** 메뉴 디자인의 fontColor (desktop/mobile 변형에서 아이콘 색) */
	iconColor?: string;
	className?: string;
}

const VARIANT_BUTTON: Record<BellVariant, string> = {
	iconbar:
		"w-10 h-10 rounded-full bg-card-bg/60 border border-card flex items-center justify-center opacity-80",
	desktop:
		"w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-theme-primary/60 hover:animate-jingle",
	mobile:
		"w-9 h-9 rounded-full flex items-center justify-center cursor-pointer bg-card-bg/60 hover:bg-theme-primary/60 hover:animate-jingle",
};

const VARIANT_ICON_SIZE: Record<BellVariant, number> = {
	iconbar: 18,
	desktop: 20,
	mobile: 18,
};

/** 메뉴의 알림 벨 버튼 + 드롭다운 알림 패널. 미읽음 뱃지 표시. */
export default function NotificationBell({
	variant = "iconbar",
	iconColor,
	className,
}: NotificationBellProps) {
	const [open, setOpen] = useState(false);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const unreadCount = useNotificationStore((state) => state.unreadCount);

	const handleOpenChange = (next: boolean) => {
		if (next && !isAuthenticated) {
			toast.info("알림은 로그인 후 이용할 수 있습니다.");
			return;
		}
		setOpen(next);
	};

	return (
		<DropdownMenu open={open} onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn("relative", VARIANT_BUTTON[variant], className)}
					style={variant !== "iconbar" ? { transition: "all 300ms ease-in-out" } : undefined}
					aria-label="알림"
				>
					<Bell
						size={VARIANT_ICON_SIZE[variant]}
						className={variant === "iconbar" ? "text-sub-text" : undefined}
						color={variant !== "iconbar" ? iconColor || "#333" : undefined}
					/>
					{isAuthenticated && unreadCount > 0 && (
						<span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold leading-none text-white">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side={variant === "iconbar" ? "left" : "bottom"}
				align="end"
				className="rounded-card border-card bg-card-bg backdrop-blur-card p-0"
			>
				{open && <NotificationPanel onNavigate={() => setOpen(false)} />}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
