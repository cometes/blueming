"use client";

import { cn } from "@/shared/lib/utils";
import { Circle } from "lucide-react";

interface RadioItemProps {
	onClickRadio: () => void;
	checked: boolean;
	content: string;
	className?: string;
}

export default function RadioItem({
	onClickRadio,
	checked,
	content,
	className,
}: RadioItemProps) {
	return (
		<button
			type="button"
			onClick={onClickRadio}
			className={cn(
				"flex items-center w-full p-5 cursor-pointer rounded-card transition-all border text-left",
				checked
					? "border-theme-primary bg-theme-primary/10"
					: "border-card bg-card-bg hover:border-card-active",
				className
			)}
			role="radio"
			aria-checked={checked}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onClickRadio();
				}
			}}
		>
			<span
				className={cn(
					"inline-flex h-4 w-4 items-center justify-center rounded-full border text-theme-primary",
					checked ? "border-theme-primary" : "border-card"
				)}
				aria-hidden="true"
			>
				<Circle
					className={cn(
						"h-2 w-2 fill-current transition-opacity",
						checked ? "opacity-100" : "opacity-0"
					)}
				/>
			</span>
			<span
				className={cn(
					"ml-2 transition-colors break-keep",
					checked ? "text-theme-primary font-medium" : "text-sub-text"
				)}
			>
				{content}
			</span>
		</button>
	);
}
