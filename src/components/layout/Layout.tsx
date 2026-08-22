"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";
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

	// 파비콘/타이틀은 app/layout.tsx의 generateMetadata가 설정한다.
	// 여기서 document.head의 <link rel="icon">을 직접 제거/추가하면 React가 소유한
	// 노드를 지우게 되어 라우트 이동 시 removeChild 크래시가 발생하므로 금지.

	const isMainPage = pathname === "/";
	const isStickerBoardEditPage = pathname === "/setting/stickerBoard/edit";
	const isMenuRightAligned = general?.menu?.design?.align === "오른쪽";

	const isSettingPage = pathname.startsWith("/setting");
	const isLibrarySeries = pathname.startsWith("/library/series");
	const isLibraryWrite = pathname === "/library/new";
	const isLibraryEdit =
		pathname.startsWith("/library/") && pathname.endsWith("/edit");
	const isLibraryDetail =
		pathname.startsWith("/library/") &&
		!isLibraryWrite &&
		!isLibraryEdit &&
		!isLibrarySeries;

	const showMenu =
		!isSettingPage && !isLibraryDetail && !isLibraryWrite && !isLibraryEdit;
	const showHeader = isSettingPage || isLibraryDetail;

	// 일반 페이지의 경우 기본 레이아웃 구조 적용
	return (
		<>
			{showHeader && (
				<header
					className={cn(
						"flex justify-between items-center px-6 py-0 w-full h-12",
						"fixed top-0 left-0 border-b border-card-bg z-50",
						"backdrop-blur-sm",
					)}
				>
					{general?.general?.logoType !== "없음" && (
						<div
							onClick={() => {
								router.push("/");
							}}
							className="cursor-pointer flex items-center"
						>
							{general?.general?.logoType === "이미지" &&
							general?.general?.logoImage ? (
								<Image
									src={general.general.logoImage}
									alt="로고"
									width={120}
									height={48}
									className="h-12 max-h-12 w-auto object-contain"
								/>
							) : (
								<h1
									className="text-lg tracking-normal"
									style={{
										fontFamily: general?.general?.logoFontFamily || undefined,
										fontWeight: general?.general?.logoFontWeight || "700",
										color: general?.general?.logoColor || undefined,
									}}
								>
									{general?.general?.logoText}
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
							? "max-w-7xl px-3.5 md:px-5 h-dvh"
							: "max-w-5xl px-3.5 md:px-5 h-auto"
				)}
			>
				<div className="w-full h-full flex items-start justify-center gap-0 sm:gap-4 md:gap-6 relative">
					{showMenu && !isMenuRightAligned && <WidgetMenu />}
					{children}
					{showMenu && isMenuRightAligned && <WidgetMenu />}
				</div>
			</div>
			<BackgroundEffect />
		</>
	);
}
