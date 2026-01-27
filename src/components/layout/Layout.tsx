"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import WidgetMenu from "../widgets/WidgetMenu";
import BackgroundEffect from "../effects/BackgroundEffect";
import { useSettings } from "@/contexts/SettingsContext";

interface LayoutProps {
	children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { general } = useSettings();

	// 파비콘 동적 변경
	useEffect(() => {
		const favicon = general?.general?.favicon;
		if (favicon) {
			// 기존 파비콘 링크 제거
			const existingFavicon = document.querySelector('link[rel="icon"]');
			if (existingFavicon) {
				existingFavicon.remove();
			}

			// 새 파비콘 링크 추가
			const link = document.createElement("link");
			link.rel = "icon";
			link.type = "image/png";
			link.href = favicon;
			document.head.appendChild(link);
		}
	}, [general?.general?.favicon]);

	// 타이틀 동적 변경
	useEffect(() => {
		const title = general?.general?.title;
		if (title) {
			document.title = title;
		}
	}, [general?.general?.title]);

	const isMainPage = pathname === "/";
	const isStickerBoardEditPage = pathname === "/setting/stickerBoard/edit";
	const isMenuRightAligned = general?.menu?.design?.align === "오른쪽";

	const isSettingPage = pathname.startsWith("/setting");
	const isLibrarySeries = pathname.startsWith("/library/series");
	const isLibraryWrite = pathname === "/library/new";
	const isLibraryEdit = pathname.startsWith("/library/") && pathname.endsWith("/edit");
	const isLibraryDetail =
		pathname.startsWith("/library/") &&
		!isLibraryWrite &&
		!isLibraryEdit &&
		!isLibrarySeries;

	const showMenu = !isSettingPage && !isLibraryDetail && !isLibraryWrite && !isLibraryEdit;
	const showHeader = isSettingPage || isLibraryDetail;

	// 일반 페이지의 경우 기본 레이아웃 구조 적용
	return (
		<>
			{showHeader && (
				<header
					className={cn(
						"flex justify-between items-center px-6 py-0 w-full h-12",
						"fixed top-0 left-0 border-b border-card-bg z-50",
						"backdrop-blur-sm"
					)}
				>
					{general?.general.logoType !== "없음" && (
						<div
							onClick={() => {
								router.push("/");
							}}
							className="cursor-pointer flex items-center"
						>
							{general?.general.logoType === "이미지" &&
							general?.general.logoImage ? (
								<Image
									src={general.general.logoImage}
									alt="로고"
									width={120}
									height={48}
									className="h-12 max-h-12 w-auto object-contain"
								/>
							) : (
								<h1 className="text-lg font-title font-bold tracking-normal">
									{general?.general.logoText}
								</h1>
							)}
						</div>
					)}
				</header>
			)}

			<div
				className={cn(
					"w-full mx-auto",
					isStickerBoardEditPage
						? "max-w-none px-0 h-auto"
						: isMainPage
						? "max-w-7xl px-5 h-dvh"
						: "max-w-5xl px-5 h-auto"
				)}
			>
			<div className="w-full h-full flex items-start justify-center gap-6 relative">
				{showMenu && !isMenuRightAligned && <WidgetMenu />}
				{children}
				{showMenu && isMenuRightAligned && <WidgetMenu />}
			</div>
			</div>
			<BackgroundEffect />
		</>
	);
}
