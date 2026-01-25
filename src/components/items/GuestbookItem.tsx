"use client";

import { useState } from "react";
import { Lock, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GuestbookEntry } from "@/queries/guestbook";
import ImageSlideModal from "@/components/modal/ImageSlideModal";

interface GuestbookItemProps {
	entry: GuestbookEntry;
	visibleSecret: boolean;
	canViewSecret: boolean;
	canEdit: boolean;
	canDelete: boolean;
	onToggleSecret: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

export default function GuestbookItem({
	entry,
	visibleSecret,
	canViewSecret,
	canEdit,
	canDelete,
	onToggleSecret,
	onEdit,
	onDelete,
}: GuestbookItemProps) {
	const showSecretContent = !entry.isSecret || visibleSecret;
	const imageUrls = entry.imageUrls ?? [];
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);
	const [activeImageIndex, setActiveImageIndex] = useState(0);

	const openImageModal = (index: number) => {
		setActiveImageIndex(index);
		setIsImageModalOpen(true);
	};

	return (
		<div className="rounded-card border-card bg-card-bg px-4 py-4">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						{entry.photoURL ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={entry.photoURL}
								alt={entry.displayName}
								className="w-7 h-7 rounded-full object-cover"
							/>
						) : (
							<div className="w-7 h-7 rounded-full bg-card border border-card flex items-center justify-center text-xs text-sub-text">
								{entry.displayName?.charAt(0) || "U"}
							</div>
						)}
						<span className="text-sm font-medium text-main-text">
							{entry.displayName}
						</span>
						{entry.isAdmin && (
							<span className="text-xs text-theme-primary inline-flex items-center gap-1">
								<ShieldCheck size={12} />
								관리자
							</span>
						)}
						<span className="text-xs text-sub-text">
							{entry.authorType === "anon" ? "익명" : "회원"}
						</span>
						{entry.isSecret && (
							<span className="text-xs text-sub-text inline-flex items-center gap-1">
								<Lock size={12} />
								비밀글
							</span>
						)}
					</div>
					<div className="mt-2">
						{entry.isSecret && !showSecretContent ? (
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-sm text-sub-text">비밀글입니다.</span>
								{canViewSecret && (
									<button
										type="button"
										onClick={onToggleSecret}
										className="text-xs text-theme-primary hover:opacity-70"
									>
										{visibleSecret ? "숨기기" : "보기"}
									</button>
								)}
							</div>
						) : (
							<p className="text-sm text-sub-text break-words">
								{entry.message}
							</p>
						)}
						{imageUrls.length > 0 && showSecretContent && (
							<div className="mt-3 flex gap-1.5">
								{imageUrls.map((url, index) => (
									<button
										key={`${entry.id}-image-${index}`}
										type="button"
										onClick={() => openImageModal(index)}
										className="relative aspect-square rounded-card border-card bg-card-bg overflow-hidden min-w-14 text-left"
										aria-label={`이미지 ${index + 1} 확대 보기`}
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={url}
											alt="첨부 이미지"
											className="absolute inset-0 w-full h-full object-cover"
										/>
									</button>
								))}
							</div>
						)}
					</div>
					{entry.createdAt && (
						<p className="mt-2 text-xs text-sub-text">
							{new Date(entry.createdAt).toLocaleString()}
						</p>
					)}
				</div>
				{(canEdit || canDelete) && showSecretContent && (
					<div className="flex items-center gap-2 shrink-0">
						{canEdit && (
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={onEdit}
								className={cn("w-9 h-9 p-0")}
							>
								<Pencil size={14} />
							</Button>
						)}
						{canDelete && (
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={onDelete}
								className={cn("w-9 h-9 p-0")}
							>
								<Trash2 size={14} />
							</Button>
						)}
					</div>
				)}
			</div>
			{imageUrls.length > 0 && (
				<ImageSlideModal
					isOpen={isImageModalOpen}
					onOpenChange={setIsImageModalOpen}
					images={imageUrls}
					initialIndex={activeImageIndex}
				/>
			)}
		</div>
	);
}
