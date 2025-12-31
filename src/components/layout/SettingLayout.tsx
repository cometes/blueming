"use client";

import { cn } from "@/lib/utils";
import { useState, ReactNode } from "react";
import { Menu, ChevronLeft } from "lucide-react";

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

	const toggleAside = () => {
		setIsAsideExpanded(!isAsideExpanded);
	};

	return (
		<div className="w-full max-w-[1200px] mx-auto mt-12 py-6">
			<div
				className="flex bg-card border border-card rounded-card h-[calc(100vh-98px)] backdrop-blur-card"
				onClick={() => {
					if (isAsideExpanded) {
						setIsAsideExpanded(false);
					}
				}}
			>
				{/* Sidebar */}
				<aside
					className={cn(
						"w-full py-6 border-r border-card-bg overflow-hidden",
						isAsideExpanded ? "cursor-default" : "cursor-pointer"
					)}
					style={{
						maxWidth: isAsideExpanded ? "240px" : "50px",
						paddingLeft: isAsideExpanded ? "24px" : "12px",
						paddingRight: isAsideExpanded ? "24px" : "12px",
						overflowY: isAsideExpanded ? "scroll" : "hidden",
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
					<div className="mb-6 relative">
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
					<div
						style={{
							opacity: isAsideExpanded ? 1 : 0,
							visibility: isAsideExpanded ? "visible" : "hidden",
							transition: "opacity 0.3s ease 0.1s, visibility 0.3s ease 0.1s",
						}}
						data-expanded={isAsideExpanded}
					>
						{sidebarGroups.map((group, groupIndex) => (
							<div className="flex flex-col gap-5" key={groupIndex}>
								<p className="text-sub-text font-semibold text-xs whitespace-nowrap cursor-default">
									{group.title}
								</p>
								{group.items.map((item) => (
									<p
										className={cn(
											"cursor-pointer py-2 px-3 rounded-card whitespace-nowrap",
											activeSection === item.id
												? "text-theme-primary"
												: "text-main-text",
											"hover:bg-card hover:text-theme-secondary"
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
				</aside>

				{/* Content */}
				<div
					className="w-full"
					style={{ flexShrink: "unset" }}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="px-5 py-3 border-b border-card-bg">
						<p className="text-2xl font-bold text-main-text">{title}</p>
						<p className="text-sub-text text-sm mt-2">{description}</p>
					</div>

					{/* Content Area */}
					<div className="p-5 h-[calc(100%-85px)] overflow-y-scroll [scrollbar-color:rgb(var(--border-widget))_transparent] [scrollbar-width:thin]">
						<section className="max-w-[768px] mx-auto">{children}</section>
					</div>
				</div>
			</div>
		</div>
	);
}
