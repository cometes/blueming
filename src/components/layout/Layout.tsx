"use client";

import { useEffect, useState } from "react";
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

	// 기본 레이아웃 구조를 사용하지 않을 페이지들 (메인 페이지 포함)
	const customLayoutPages = [""];
	const useCustomLayout = customLayoutPages.includes(pathname);

	// WidgetMenu를 숨길 페이지 목록
	const hideMenuPages = ["/setting", "/setting/*", "/library/*"];

	// 헤더를 숨길 페이지 목록
	const hideHeaderPages = ["/", "/library/new"];

	// 와일드카드 패턴 매칭을 지원하는 페이지 숨김 검사 함수
	const shouldHideMenu = hideMenuPages.some((pattern) => {
		if (pattern.endsWith("/*")) {
			// 와일드카드 패턴: /library/* -> /library의 하위 페이지만 (기본 페이지 제외)
			const basePath = pattern.slice(0, -2); // /* 제거
			return pathname.startsWith(basePath) && pathname !== basePath;
		} else {
			// 정확한 경로 매칭
			return pathname === pattern;
		}
	});

	// 헤더를 숨길지 결정하는 함수
	const shouldHideHeader =
		hideHeaderPages.includes(pathname) ||
		(pathname.startsWith("/library/") && pathname.endsWith("/edit"));

	const [isHeaderVisible, setIsHeaderVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);

	useEffect(() => {
		if (useCustomLayout) return;

		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			if (currentScrollY > lastScrollY && currentScrollY > 50) {
				// 스크롤 다운 - 헤더 숨김
				setIsHeaderVisible(false);
			} else {
				// 스크롤 업 - 헤더 보임
				setIsHeaderVisible(true);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [useCustomLayout, lastScrollY]);

	// 커스텀 레이아웃을 사용하는 페이지의 경우 기본 구조 없이 렌더링
	if (useCustomLayout) {
		return (
			<>
				<BackgroundEffect />
				{children}
			</>
		);
	}

	// 일반 페이지의 경우 기본 레이아웃 구조 적용
	return (
		<>
			{!shouldHideHeader && (
				<header
					className={cn(
						"flex justify-between items-center px-6 py-0 w-full h-12",
						"fixed top-0 left-0 border-b border-card-bg z-50",
						"backdrop-blur-sm",
						isHeaderVisible ? "translate-y-0" : "-translate-y-full"
					)}
					style={{ transition: "transform 300ms ease-in-out" }}
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
					{!shouldHideMenu && !isMenuRightAligned && <WidgetMenu />}
					{children}
					{!shouldHideMenu && isMenuRightAligned && <WidgetMenu />}
				</div>
			</div>
			<BackgroundEffect />
		</>
	);
}
