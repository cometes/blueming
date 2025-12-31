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
				"flex items-center w-full p-5 cursor-pointer rounded-lg transition-all",
				"border backdrop-blur-sm",
				checked
					? "border-gray-400 bg-gray-50/80 dark:border-gray-600 dark:bg-gray-900/80"
					: "border-gray-300 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/80 hover:border-gray-400 dark:hover:border-gray-600",
				className
			)}
		>
			<div
				className={cn(
					"w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
					checked
						? "border-blue-500 bg-blue-500"
						: "border-gray-400 dark:border-gray-500"
				)}
			>
				{checked && (
					<div className="w-2 h-2 rounded-full bg-white" />
				)}
			</div>
			<span
				className={cn(
					"ml-2 transition-colors",
					checked
						? "text-gray-900 dark:text-gray-100 font-medium"
						: "text-gray-500 dark:text-gray-400"
				)}
			>
				{content}
			</span>
		</div>
	);
}
