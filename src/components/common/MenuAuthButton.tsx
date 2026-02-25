"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/auth/UseAuth";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type MenuAuthVariant = "desktop" | "iconbar";

interface MenuAuthButtonProps {
	variant?: MenuAuthVariant;
	className?: string;
	dropdownPortal?: boolean;
	dropdownSide?: "top" | "right" | "bottom" | "left";
	dropdownAlign?: "start" | "center" | "end";
}

const getInitial = (label?: string | null) => {
	if (!label) return "U";
	return label.trim().charAt(0).toUpperCase() || "U";
};

export default function MenuAuthButton({
	variant = "desktop",
	className,
	dropdownPortal = true,
	dropdownSide = "right",
	dropdownAlign = "center",
}: MenuAuthButtonProps) {
	const router = useRouter();
	const { isAuthenticated, user, isLoading, handleLogin, handleLogout } =
		useAuth();
	const { isManagerOrAdmin } = useAdmin();
	const [imageFailed, setImageFailed] = useState(false);

	const displayLabel = useMemo(
		() => user?.displayName || user?.email || "",
		[user]
	);

	const onLoginClick = async () => {
		const result = await handleLogin(
			() => toast.success("로그인되었습니다."),
			() => toast.error("로그인에 실패했습니다.")
		);
		// 팝업이 차단된 경우에만 즉시 에러 표시
		if (result.success === false) {
			toast.error(result.message);
		}
	};

	const onLogoutClick = async () => {
		const result = await handleLogout();
		if (result.success) {
			toast.success("로그아웃되었습니다.");
		} else {
			toast.error("로그아웃에 실패했습니다.");
		}
	};

	if (isLoading) {
		return (
			<div
				className={cn(
					variant === "iconbar" ? "w-10 h-10" : "w-24 h-9",
					"rounded-full bg-card-bg/60 border border-card animate-pulse",
					className
				)}
			/>
		);
	}

	if (!isAuthenticated) {
		if (variant === "iconbar") {
			return (
				<Button
					type="button"
					variant="outline"
					size="icon"
					className={cn(
						"w-10 h-10 rounded-full border-card bg-card-bg/60",
						className
					)}
					onClick={onLoginClick}
					aria-label="로그인"
				>
					<User size={18} />
				</Button>
			);
		}

		return (
			<Button
				type="button"
				onClick={onLoginClick}
				className={className}
			>
				로그인
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn(
						"relative flex items-center justify-center rounded-full border border-card bg-card-bg/60",
						variant === "iconbar" ? "w-10 h-10" : "w-11 h-11",
						className
					)}
					aria-label="프로필 메뉴"
				>
					{user?.photoURL && !imageFailed ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={user.photoURL}
							alt={displayLabel || "프로필"}
							className="w-full h-full rounded-full object-cover"
							onError={() => setImageFailed(true)}
						/>
					) : (
						<span className="text-sm font-semibold text-sub-text">
							{getInitial(displayLabel)}
						</span>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={dropdownAlign}
				side={dropdownSide}
				sideOffset={8}
				portal={dropdownPortal}
			>
				{isManagerOrAdmin && (
					<>
						<DropdownMenuItem
							onClick={() => router.push("/setting")}
							className="cursor-pointer"
						>
							<Settings size={14} className="mr-2" />
							홈페이지 설정
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuItem
					onClick={onLogoutClick}
					className="cursor-pointer text-red-500 focus:text-red-500"
				>
					<LogOut size={14} className="mr-2" />
					로그아웃
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
