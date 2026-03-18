"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import type { GuestbookEntry } from "@/features/guestbook/types";
import { ImagePlus, Lock, Send } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import GuestbookItem from "@/features/guestbook/components/GuestbookItem";
import GuestbookEditDialog from "@/components/guestbook/GuestbookEditDialog";
import GuestbookSecretDialog from "@/components/guestbook/GuestbookSecretDialog";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import { useGuestbookController } from "@/features/guestbook/hooks/useGuestbookController";

const DEFAULT_PAGE_SIZE = 10;

interface GuestbookClientProps {
	initialEntries: GuestbookEntry[];
	total: number;
	pageSize?: number;
}

export default function GuestbookClient({
	initialEntries,
	total,
	pageSize = DEFAULT_PAGE_SIZE,
}: GuestbookClientProps) {
	const {
		isAuthLoading,
		resolvedMode,
		entries,
		totalCount,
		currentPage,
		setCurrentPage,
		totalPages,
		canSubmit,
		cooldownRemaining,
		dialogOpen,
		setDialogOpen,
		dialogMode,
		dialogPin,
		setDialogPin,
		dialogMessage,
		setDialogMessage,
		dialogImages,
		dialogSecret,
		setDialogSecret,
		activeEntry,
		secretDialogOpen,
		setSecretDialogOpen,
		secretDialogPin,
		setSecretDialogPin,
		isVerifyingSecret,
		form,
		imageDialog,
		assets,
		maxImageCount,
		handleCreate,
		handleUpdate,
		handleDelete,
		openDialog,
		closeDialog,
		handleSecretToggle,
		handleVerifySecret,
		closeSecretDialog,
		removeImageFromTarget,
		handleImageDialogOpen,
		handleImageUpload,
	} = useGuestbookController({
		initialEntries,
		total,
		pageSize,
	});

	return (
		<div className="shrink-0 w-full max-w-[540px] mt-[90px] mb-[40px] mx-auto">
			<h2 className="text-[20px] font-semibold text-main-text font-title">방명록</h2>
			<p className="text-sm text-sub-text mt-2">간단한 메시지를 남겨주세요.</p>
			<section className="bg-card border-card rounded-card p-3 mt-10">
				{isAuthLoading ? (
					<div className="space-y-2">
						<div className="flex gap-1.5">
							<div className="w-full">
								<Skeleton className="h-4 w-10 mb-1 bg-card" />
								<Skeleton className="h-9 w-full rounded-card bg-card" />
							</div>
							<div className="w-full">
								<Skeleton className="h-4 w-16 mb-1 bg-card" />
								<Skeleton className="h-9 w-full rounded-card bg-card" />
							</div>
						</div>
						<div>
							<Skeleton className="h-4 w-14 mb-1 bg-card" />
							<Skeleton className="h-[120px] w-full rounded-card bg-card" />
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Skeleton className="h-5 w-20 bg-card" />
								<Skeleton className="h-9 w-9 rounded-card bg-card" />
							</div>
							<Skeleton className="h-9 w-20 rounded-card bg-card" />
						</div>
					</div>
				) : (
				<div className="space-y-2">
					{resolvedMode === "anon" && (
						<>
							<div className="flex gap-1.5">
								<div className="w-full">
									<p className="text-sm text-sub-text mb-1">name</p>
									<Input
										type="text"
										placeholder="닉네임"
										value={form.displayName}
										onChange={(e) => form.setDisplayName(e.target.value)}
										className=""
									/>
								</div>
								<div className="w-full">
									<p className="text-sm text-sub-text mb-1">password</p>
									<Input
										type="password"
										placeholder="비밀번호 4자리"
										inputMode="numeric"
										value={form.pin}
										onChange={(e) => form.setPin(e.target.value)}
										className=""
									/>
								</div>
							</div>
						</>
					)}
					<div>
						<p className="text-sm text-sub-text mb-1">message</p>
						<textarea
							value={form.message}
							onChange={(e) => form.setMessage(e.target.value)}
							placeholder="메시지를 입력해주세요"
							maxLength={500}
							className="w-full min-h-[120px] rounded-card border-card bg-card-bg px-4 py-3 text-sm text-main-text resize-none"
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex flex-wrap items-center gap-3">
							<label className="inline-flex items-center gap-2 text-sm text-sub-text">
								<Switch
								checked={form.isSecret}
								onCheckedChange={form.setIsSecret}
							/>
								<Lock size={14} />
								비밀글
							</label>
							<button
								type="button"
								onClick={() => handleImageDialogOpen("create")}
								disabled={
									form.isSubmitting || form.images.length >= maxImageCount
								}
								className={cn(
									"inline-flex items-center justify-center w-9 h-9 rounded-card border border-card bg-card-bg text-main-text",
									form.isSubmitting || form.images.length >= maxImageCount
										? "opacity-60 pointer-events-none"
										: "",
								)}
								aria-label="사진 첨부"
							>
								<ImagePlus size={16} />
							</button>
							<span className="text-xs text-sub-text">
								{form.images.length}/{maxImageCount}
							</span>
							{cooldownRemaining > 0 && (
								<span className="text-xs text-sub-text">
									{cooldownRemaining}초 후에 다시 작성할 수 있어요.
								</span>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={handleCreate}
								disabled={!canSubmit || form.isSubmitting}
								className="w-8 h-8 p-0"
								aria-label="방명록 등록"
							>
								<Send size={16} className="text-theme-primary" />
							</Button>
						</div>
					</div>

					{form.images.length > 0 && (
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
							{form.images.map((image) => (
								<div
									key={image.id}
									className="relative aspect-square rounded-card border-card bg-card-bg overflow-hidden"
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={image.url}
										alt="첨부 이미지"
										className="absolute inset-0 w-full h-full object-cover"
									/>
									<button
										type="button"
										onClick={() => removeImageFromTarget("create", image.id)}
										className="absolute top-1 right-1 rounded-full bg-black/60 text-white text-[10px] px-2 py-0.5"
									>
										삭제
									</button>
								</div>
							))}
						</div>
					)}
				</div>
				)}
			</section>

			<section className="mt-8">
				<div className="flex items-center justify-between">
					<h3 className="text-sm text-sub-text">
						총 {totalCount}개
					</h3>
				</div>

				<div className="mt-4 space-y-4">
					{entries.map((entry) => (
						<GuestbookItem
							key={entry.id}
							entry={entry}
							onToggleSecret={() => handleSecretToggle(entry)}
							onEdit={entry.canEdit ? () => openDialog(entry, "edit") : undefined}
							onDelete={
								entry.canDelete ? () => openDialog(entry, "delete") : undefined
							}
						/>
					))}

					{entries.length === 0 && (
						<div className="text-center py-10 text-sub-text">
							첫 번째 메시지를 남겨보세요.
						</div>
					)}
				</div>

				{totalPages > 1 && (
					<div className="flex justify-center mt-6">
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										onClick={(e) => {
											e.preventDefault();
											setCurrentPage((prev) => Math.max(1, prev - 1));
										}}
									/>
								</PaginationItem>
								{Array.from({ length: totalPages }).map((_, index) => {
									const page = index + 1;
									return (
										<PaginationItem key={page}>
											<PaginationLink
												isActive={page === currentPage}
												onClick={(e) => {
													e.preventDefault();
													setCurrentPage(page);
												}}
											>
												{page}
											</PaginationLink>
										</PaginationItem>
									);
								})}
								<PaginationItem>
									<PaginationNext
										onClick={(e) => {
											e.preventDefault();
											setCurrentPage((prev) => Math.min(totalPages, prev + 1));
										}}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</section>

			<GuestbookEditDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				mode={dialogMode}
				isAnon={activeEntry?.authorType === "anon"}
				isAdmin={activeEntry?.isAdmin === true}
				dialogPin={dialogPin}
				onDialogPinChange={setDialogPin}
				dialogMessage={dialogMessage}
				onDialogMessageChange={setDialogMessage}
				dialogSecret={dialogSecret}
				onDialogSecretChange={setDialogSecret}
				dialogImages={dialogImages}
				onRemoveDialogImage={(id) => removeImageFromTarget("edit", id)}
				onOpenImageDialog={() => handleImageDialogOpen("edit")}
				onClose={closeDialog}
				onConfirm={dialogMode === "edit" ? handleUpdate : handleDelete}
			/>

			<GuestbookSecretDialog
				open={secretDialogOpen}
				onOpenChange={setSecretDialogOpen}
				pin={secretDialogPin}
				onPinChange={setSecretDialogPin}
				isVerifying={isVerifyingSecret}
				onClose={closeSecretDialog}
				onConfirm={handleVerifySecret}
			/>

			<ImageUploadDialog
				isOpen={imageDialog.isOpen}
				onOpenChange={imageDialog.setIsOpen}
				thumbnail={imageDialog.previewUrl}
				setThumbnail={imageDialog.setPreview}
				uploadMode="deferred"
				onFileSelect={(file, previewUrl) => {
					imageDialog.setMultipleFiles([file], [previewUrl]);
				}}
				onUpload={handleImageUpload}
				rightContent={
					<AssetGrid
						assets={assets.assets}
						loading={assets.loading}
						error={assets.error}
						selectedUrl={imageDialog.previewUrl}
						onSelect={(asset) => imageDialog.setPreview(asset.url)}
						aspectClassName="aspect-square"
						imageClassName="w-full h-full object-contain"
						gridTemplateColumns="repeat(3, minmax(0, 1fr))"
					/>
				}
				enableAssetSearch={true}
				assetSearchQuery={assets.searchQuery}
				onAssetSearchChange={assets.setSearchQuery}
			/>
		</div>
	);
}
