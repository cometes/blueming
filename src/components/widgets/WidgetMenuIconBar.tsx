/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import MenuAuthButton from "@/components/common/MenuAuthButton";
import NotificationBell from "@/components/common/NotificationBell";
import { useMusicPlayerStore } from "@/features/music/store/useMusicPlayerStore";
import { cn } from "@/shared/lib/utils";
import type { OpenFolders } from "@/features/settings/lib/widgetMenu";
import type { MenuDesign, MenuItem } from "@/features/settings/types";
import {
	Square,
	Book,
	Archive,
	Image as ImageIcon,
	MessageCircle,
	Settings,
	Folder,
	Link as LinkIcon,
} from "lucide-react";

type Props = {
	design: Partial<MenuDesign>;
	filteredMenuItems: MenuItem[];
	iconBarStyle: React.CSSProperties;
	openFolders: OpenFolders;
	onMenuClick: (item: MenuItem) => (e: React.MouseEvent) => void;
	onSubMenuClick: (parentId: string, subMenuName: string) => void;
	className?: string;
};

const renderIconBarLogo = (design: Partial<MenuDesign>) => {
	if (design?.iconBarLogoType !== "이미지") {
		return null;
	}

	if (!design?.iconBarLogoImage) {
		return (
			<div className="w-10 h-10 rounded-full bg-card-bg/70 flex items-center justify-center text-xs text-sub-text">
				LOGO
			</div>
		);
	}

	return (
		<img
			src={design.iconBarLogoImage}
			alt="Icon bar logo"
			className="w-10 h-10 rounded-full object-contain"
		/>
	);
};

const getMenuIcon = (category: string) => {
	switch (category) {
		case "라이브러리":
			return <Book size={16} className="text-sub-text" />;
		case "아카이브":
			return <Archive size={16} className="text-sub-text" />;
		case "갤러리":
			return <ImageIcon size={16} className="text-sub-text" />;
		case "메모":
			return <MessageCircle size={16} className="text-sub-text" />;
		case "방명록":
			return <MessageCircle size={16} className="text-sub-text" />;
		case "설정":
			return <Settings size={16} className="text-sub-text" />;
		case "폴더":
			return <Folder size={16} className="text-sub-text" />;
		case "커스텀":
			return <LinkIcon size={16} className="text-sub-text" />;
		default:
			return <Square size={16} className="text-sub-text" />;
	}
};

export default function WidgetMenuIconBar({
	design,
	filteredMenuItems,
	iconBarStyle,
	openFolders,
	onMenuClick,
	onSubMenuClick,
	className,
}: Props) {
	const toggleMusicPlayer = useMusicPlayerStore((state) => state.toggleOpen);
	const isMusicPlaying = useMusicPlayerStore((state) => state.isPlaying);
	const iconBarLogo = renderIconBarLogo(design);

	return (
		<aside
			className={cn(
				"menu-iconbar h-dvh flex flex-col items-center shrink-0 sticky top-0 z-10 overflow-visible px-2",
				className,
			)}
			style={iconBarStyle}
		>
			<TooltipProvider delayDuration={150}>
				<nav className="w-full h-full flex flex-col items-center py-6 overflow-visible gap-4 justify-center">
					<div className="w-full flex items-center justify-center">
						{iconBarLogo ? <Link href="/">{iconBarLogo}</Link> : null}
					</div>

					<ul className="flex flex-col items-center gap-3">
						{filteredMenuItems.map((item) => (
							<li key={item.uniqueId} className="relative">
								<Tooltip>
									<TooltipTrigger asChild>
										{item.iconImage ? (
											<button
												type="button"
												onClick={onMenuClick(item)}
												className="w-10 h-10 flex items-center justify-center leading-none"
											>
												<img
													src={item.iconImage}
													alt={item.name}
													className="block w-10 h-10 object-contain"
												/>
											</button>
										) : (
											<button
												type="button"
												onClick={onMenuClick(item)}
												className="w-10 h-10 rounded-full bg-card-bg/60 border border-card flex items-center justify-center leading-none"
											>
												{getMenuIcon(item.category)}
											</button>
										)}
									</TooltipTrigger>
									<TooltipContent side="right" align="center">
										{item.name}
									</TooltipContent>
								</Tooltip>
								{item.category === "폴더" && item.subMenus?.length ? (
									<ul
										className="flex flex-col items-center gap-2 overflow-hidden"
										style={{
											marginTop: openFolders[item.uniqueId] ? "8px" : "0px",
											maxHeight: openFolders[item.uniqueId] ? "160px" : "0px",
											opacity: openFolders[item.uniqueId] ? 1 : 0,
											transition: "max-height 300ms ease, opacity 300ms ease",
										}}
									>
										{item.subMenus.map((subMenu, idx) => {
											const name =
												typeof subMenu === "string" ? subMenu : subMenu.name;
											return (
												<li key={`${item.uniqueId}-sub-${idx}`}>
													<Tooltip>
														<TooltipTrigger asChild>
															<button
																type="button"
																onClick={() =>
																	onSubMenuClick(item.uniqueId, name)
																}
																className="w-8 h-8 rounded-full bg-card-bg/60 border border-card flex items-center justify-center"
															>
																{getMenuIcon(name)}
															</button>
														</TooltipTrigger>
														<TooltipContent side="right" align="center">
															{name}
														</TooltipContent>
													</Tooltip>
												</li>
											);
										})}
									</ul>
								) : null}
							</li>
						))}
					</ul>

					<div className="flex flex-col items-center gap-3">
						<NotificationBell variant="iconbar" />
						<button
							type="button"
							className="w-10 h-10 rounded-full bg-card-bg/60 border border-card flex items-center justify-center opacity-80"
							aria-label="음악"
							onClick={toggleMusicPlayer}
						>
							<div className="flex items-end justify-center w-4 h-4">
								{[0, 0.1, 0.2, 0.3, 0.4].map((delay, index) => (
									<span
										key={index}
										style={{
											display: "block",
											width: "1px",
											background: design?.fontColor || "#333333",
											margin: "0 1px",
											height: ["6px", "8px", "10px", "13px", "15px"][index],
											animation: `musicBar 1.2s ease infinite ${delay}s`,
										animationPlayState: isMusicPlaying ? "running" : "paused",
										}}
									/>
								))}
							</div>
						</button>
						<MenuAuthButton variant="iconbar" className="opacity-80" />
					</div>
				</nav>
			</TooltipProvider>
		</aside>
	);
}
