/* eslint-disable @next/next/no-img-element */
"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ICON_COLOR, ICON_SIZE, UPLOAD_TEXT } from "@/features/settings/lib/menu";

interface ImageUploadSectionProps {
	title: string;
	description?: string;
	imageSrc?: string;
	onFileSelect: (file: File) => void;
	onClearClick: () => void;
	onOpenPicker?: () => void;
	isUploading?: boolean;
}

export function ImageUploadSection({
	title,
	description,
	imageSrc,
	onFileSelect,
	onClearClick,
	onOpenPicker,
	isUploading = false,
}: ImageUploadSectionProps) {
	return (
		<div className="section-box flex items-center mt-4">
			<div className="text-box w-[220px]">
				<h3 className="font-medium text-sub-text">{title}</h3>
				{description && (
					<p className="text-xs text-gray-500 dark:text-gray-400">
						{description}
					</p>
				)}
			</div>
			<div className="flex items-center gap-3">
				{onOpenPicker ? (
					<button
						type="button"
						onClick={onOpenPicker}
						className={`relative w-3xs max-h-32 aspect-video rounded-card border-card bg-card-bg overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-card-active transition-colors ${
							isUploading ? "opacity-60 pointer-events-none" : ""
						}`}
					>
						{imageSrc ? (
							<img
								src={imageSrc}
								alt={title}
								className="w-full h-full object-contain"
							/>
						) : (
							<>
								<ImagePlus
									size={ICON_SIZE}
									color={ICON_COLOR}
									absoluteStrokeWidth={true}
								/>
								<span className="text-xs text-gray-500 dark:text-gray-400">
									{UPLOAD_TEXT}
								</span>
							</>
						)}
					</button>
				) : (
					<label
						className={`relative w-3xs max-h-32 aspect-video rounded-card border-card bg-card-bg overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-card-active transition-colors ${
							isUploading ? "opacity-60 pointer-events-none" : ""
						}`}
					>
						{imageSrc ? (
							<img
								src={imageSrc}
								alt={title}
								className="w-full h-full object-contain"
							/>
						) : (
							<>
								<ImagePlus
									size={ICON_SIZE}
									color={ICON_COLOR}
									absoluteStrokeWidth={true}
								/>
								<span className="text-xs text-gray-500 dark:text-gray-400">
									{UPLOAD_TEXT}
								</span>
							</>
						)}
						<input
							type="file"
							accept="image/*"
							className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
							onChange={(event) => {
								const file = event.target.files?.[0];
								if (file) onFileSelect(file);
								event.target.value = "";
							}}
						/>
					</label>
				)}
				{imageSrc && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onClearClick}
						className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
					>
						<Trash2 size={14} className="mr-2" />
						비우기
					</Button>
				)}
			</div>
		</div>
	);
}

