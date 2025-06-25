"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import WidgetMenu from "../widgets/WidgetMenu";
import LoginButton from "../common/LoginButton";

interface LayoutProps {
	children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { general } = useSettings();

	const isMainPage = pathname === "/";
	const hideHeaderPages = ["/", "/library/new"];
	const hideMenuPages = ["/setting", "/library/*"];
	const shouldHideHeader = hideHeaderPages.includes(pathname);

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

	const [isHeaderVisible, setIsHeaderVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			if (currentScrollY > lastScrollY && currentScrollY > 50) {
				setIsHeaderVisible(false);
			} else {
				setIsHeaderVisible(true);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [lastScrollY]);

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
						{general.general.logoText}
					</h1>
				</header>
			)}

			<div
				className={cn(
					"w-full mx-auto px-5",
					isMainPage ? "max-w-7xl h-dvh" : "max-w-5xl h-auto"
				)}
			>
				<div className="w-full h-full flex items-start justify-center gap-6">
					{!shouldHideMenu && <WidgetMenu />}
					{children}
				</div>
			</div>
		</>
	);
}
