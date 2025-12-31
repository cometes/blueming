"use client";

import { cn } from "@/lib/utils";

interface RadioItemProps {
	onClickRadio: () => void;
	checked: boolean;
	defaultChecked?: boolean;
	content: string;
	className?: string;
}

export default function RadioItem({
	onClickRadio,
	checked,
	defaultChecked,
	content,
	className,
}: RadioItemProps) {
	return (
		<div
			onClick={onClickRadio}
			className={cn(
				"flex items-center w-full p-5 cursor-pointer rounded-card transition-all",
				"border",
				checked
					? "border-theme-primary bg-theme-primary/10"
					: "border-card bg-card-bg hover:border-card-active",
				className
			)}
		>
			<div
				className={cn(
					"w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
					checked
						? "border-theme-primary bg-theme-primary"
						: "border-card bg-card-bg hover:border-card-active"
				)}
			>
				{checked && <div className="w-2 h-2 rounded-full bg-white" />}
			</div>
			<span
				className={cn(
					"ml-2 transition-colors",
					checked ? "text-theme-primary font-medium" : "text-sub-text"
				)}
			>
				{content}
			</span>
		</div>
	);
}
