"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import LoginButton from "../common/LoginButton";
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

	const isMainPage = pathname === "/";

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
	const shouldHideHeader = hideHeaderPages.includes(pathname);

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
				<LoginButton />
				{children}
			</>
		);
	}

	// 일반 페이지의 경우 기본 레이아웃 구조 적용
	return (
		<>
			<LoginButton />
			{!shouldHideHeader && (
				<header
					className={cn(
						"flex justify-between items-center px-6 py-0 w-full h-12",
						"fixed top-0 left-0 border-b border-card-bg z-50",
						"transition-transform ease-in-out duration-300 backdrop-blur-sm",
						isHeaderVisible ? "translate-y-0" : "-translate-y-full"
					)}
				>
					<h1
						onClick={() => {
							router.push("/");
						}}
						className="text-lg cursor-pointer font-title font-bold tracking-normal"
					>
						{general?.general.logoText}
					</h1>
				</header>
			)}

			<div
				className={cn(
					"w-full mx-auto px-5",
					isMainPage ? "max-w-7xl h-dvh" : "max-w-5xl h-auto"
				)}
			>
				<div className="w-full h-full flex items-start justify-center gap-6 relative z-10">
					{!shouldHideMenu && <WidgetMenu />}
					{children}
				</div>
			</div>
			<BackgroundEffect />
		</>
	);
}
