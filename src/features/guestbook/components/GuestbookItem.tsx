/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { renderContentWithMentions } from "@/features/mention/lib/renderMentions";
import { Lock, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import Avatar from "@/components/common/Avatar";
import ImageSlideModal from "@/components/modal/ImageSlideModal";
import type { GuestbookEntry } from "@/features/guestbook/types";

interface GuestbookItemProps {
	entry: GuestbookEntry;
	onToggleSecret?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
}

export default function GuestbookItem({
	entry,
	onToggleSecret,
	onEdit,
	onDelete,
}: GuestbookItemProps) {
	const showSecretContent = !entry.isSecret || entry.masked !== true;
	const imageUrls = entry.displayImageUrls ?? entry.imageUrls ?? [];
	const displayMessage = entry.displayMessage ?? entry.message ?? "";
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
						<Avatar
							src={entry.photoURL}
							name={entry.displayName}
							alt={entry.displayName}
							className="h-7 w-7 bg-card"
						/>
						<span className="text-sm font-medium text-main-text">
							{entry.displayName}
						</span>
						{entry.isAdmin && (
							<span className="text-xs text-theme-primary inline-flex items-center gap-1">
								<ShieldCheck size={12} />
								관리자
							</span>
						)}
						{!entry.isAdmin && (
							<span className="text-xs text-sub-text">
								{entry.authorLabel ??
									(entry.authorType === "anon" ? "익명" : "회원")}
							</span>
						)}
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
								{entry.canViewSecret && (
									<button
										type="button"
										onClick={onToggleSecret}
										className="text-xs text-theme-primary hover:opacity-70"
									>
										보기
									</button>
								)}
							</div>
						) : (
							<p className="text-sm text-sub-text break-words">
								{renderContentWithMentions(displayMessage, entry.mentions)}
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
				{(entry.canEdit || entry.canDelete) && showSecretContent && (
					<div className="flex items-center gap-2 shrink-0">
						{entry.canEdit && (
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={onEdit}
								disabled={!onEdit}
								className={cn("w-9 h-9 p-0")}
							>
								<Pencil size={14} />
							</Button>
						)}
						{entry.canDelete && (
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={onDelete}
								disabled={!onDelete}
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
