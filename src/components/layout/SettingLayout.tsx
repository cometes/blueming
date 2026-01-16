"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, ReactNode } from "react";
import { Menu, ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSettingStatusContext } from "@/contexts/SettingStatusContext";

interface SettingSidebarItem {
	id: string;
	label: string;
}

interface SettingSidebarGroup {
	title: string;
	items: SettingSidebarItem[];
}

interface SettingLayoutProps {
	children: ReactNode;
	sidebarGroups: SettingSidebarGroup[];
	activeSection: string;
	onSectionChange: (section: string) => void;
	title: string;
	description: string;
}

export default function SettingLayout({
	children,
	sidebarGroups,
	activeSection,
	onSectionChange,
	title,
	description,
}: SettingLayoutProps) {
	const [isAsideExpanded, setIsAsideExpanded] = useState(false);
	const { overallStatus, dirtyCount } = useSettingStatusContext();
	const [shouldAnimate] = useState(() => {
		if (typeof window === "undefined") return false;
		return !(window as Window & { __settingFadeInSeen?: boolean })
			.__settingFadeInSeen;
	});

	useEffect(() => {
		if (shouldAnimate) {
			(
				window as Window & { __settingFadeInSeen?: boolean }
			).__settingFadeInSeen = true;
		}
	}, [shouldAnimate]);

	const toggleAside = () => {
		setIsAsideExpanded(!isAsideExpanded);
	};

	const currentStatus = overallStatus;

	return (
		<div
			className={cn(
				"w-full max-w-[1200px] mx-auto mt-4 px-4 pb-4",
				shouldAnimate ? "animate-in fade-in-0 duration-500" : "opacity-100"
			)}
		>
			<div
				className="relative bg-card border border-card rounded-card h-[calc(100vh-80px)] overflow-hidden"
				onClick={() => {
					if (isAsideExpanded) {
						setIsAsideExpanded(false);
					}
				}}
			>
				<div
					className="absolute inset-0 rounded-card backdrop-blur-card pointer-events-none"
					style={{
						backgroundColor: "color-mix(in srgb, var(--card-bg) 12%, transparent)",
					}}
				/>
				<div className="relative z-10 flex h-full">
					{/* Sidebar */}
					<aside
						className={cn(
							"w-full py-6 border-r border-card-bg overflow-hidden flex flex-col h-full",
							isAsideExpanded ? "cursor-default" : "cursor-pointer"
						)}
						style={{
							maxWidth: isAsideExpanded ? "240px" : "50px",
							transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
						}}
						data-expanded={isAsideExpanded}
						onClick={(e) => {
							e.stopPropagation();
							if (!isAsideExpanded) {
								toggleAside();
							}
						}}
					>
					<div
						className="mb-6 relative flex-none"
						style={{
							paddingLeft: isAsideExpanded ? "24px" : "12px",
							paddingRight: isAsideExpanded ? "24px" : "12px",
						}}
					>
						<div
							style={{
								opacity: isAsideExpanded ? 1 : 0,
								visibility: isAsideExpanded ? "visible" : "hidden",
								transition: isAsideExpanded
									? "opacity 0.3s ease 0.4s, visibility 0.3s ease 0.4s"
									: "opacity 0.3s ease, visibility 0.3s ease",
							}}
						>
							<button
								onClick={(e) => {
									e.stopPropagation();
									setIsAsideExpanded(false);
								}}
								className="flex items-center gap-2 text-main-text hover:text-theme-primary cursor-pointer"
								style={{
									transition: "color 0.3s ease",
								}}
							>
								<ChevronLeft size={20} />
								<span className="text-sm font-medium whitespace-nowrap">
									메뉴 접기
								</span>
							</button>
						</div>
						<div
							className="absolute top-0 left-0 w-full"
							style={{
								opacity: !isAsideExpanded ? 1 : 0,
								visibility: !isAsideExpanded ? "visible" : "hidden",
								transition: !isAsideExpanded
									? "opacity 0.3s ease 0.4s, visibility 0.3s ease 0.4s"
									: "opacity 0s ease, visibility 0s ease",
							}}
						>
							<div className="flex justify-center">
								<Menu size={20} className="text-main-text" />
							</div>
						</div>
					</div>

					<ScrollArea
						className="flex-1 min-h-0 [&_[data-slot=scroll-area-thumb]]:bg-widget-border "
						style={{
							opacity: isAsideExpanded ? 1 : 0,
							visibility: isAsideExpanded ? "visible" : "hidden",
							transition: "opacity 0.3s ease 0.1s, visibility 0.3s ease 0.1s",
						}}
					>
						<div
							className="flex flex-col gap-8"
							style={{
								paddingLeft: isAsideExpanded ? "24px" : "12px",
								paddingRight: isAsideExpanded ? "24px" : "12px",
								paddingBottom: "24px",
							}}
						>
							{sidebarGroups.map((group, groupIndex) => (
								<div className="flex flex-col gap-5" key={groupIndex}>
									<p className="text-sub-text font-semibold text-xs whitespace-nowrap cursor-default">
										{group.title}
									</p>
									{group.items.map((item) => (
										<p
											className={cn(
												"cursor-pointer py-2 px-3 rounded-card whitespace-nowrap leading-4.5",
												activeSection === item.id
													? "text-theme-primary"
													: "text-main-text",
												"hover:bg-card-bg hover:text-theme-secondary"
											)}
											style={{
												transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
											}}
											key={item.id}
											data-active={activeSection === item.id}
											onClick={(e) => {
												e.stopPropagation();
												onSectionChange(item.id);
											}}
										>
											{item.label}
										</p>
									))}
								</div>
							))}
						</div>
					</ScrollArea>
					</aside>

					{/* Content */}
					<div
						className="w-full flex flex-col h-full overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="px-5 py-3 border-b border-card-bg flex-none">
							<div className="flex items-center gap-3">
								<p className="text-2xl font-bold text-main-text">{title}</p>
								<Badge
									variant="outline"
									className={cn(
										"text-[11px] px-2 py-0.5",
										currentStatus === "dirty"
											? "border-amber-400 text-amber-500 bg-amber-500/10"
											: "border-emerald-400 text-emerald-500 bg-emerald-500/10"
									)}
								>
									{currentStatus === "dirty"
										? `저장 필요${dirtyCount > 0 ? ` · ${dirtyCount}` : ""}`
										: "저장됨"}
								</Badge>
							</div>
							<p className="text-sub-text text-sm mt-2">{description}</p>
						</div>

						{/* Content Area */}
						<ScrollArea className="flex-1 min-h-0 [&_[data-slot=scroll-area-thumb]]:bg-widget-border">
							<section className="p-5">{children}</section>
						</ScrollArea>
					</div>
				</div>
			</div>
		</div>
	);
}
