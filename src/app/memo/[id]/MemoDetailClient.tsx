"use client";

import { ArrowLeft, Lock, MoreHorizontal, X } from "lucide-react";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import type { MemoDetail } from "@/features/memo/types";
import { useMemoDetailController } from "@/features/memo/hooks/useMemoDetailController";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import { dateTimeConvert } from "@/shared/lib/date";
import ImageSlideModal from "@/components/modal/ImageSlideModal";
import MemoCreateModal from "@/features/memo/components/MemoCreateModal";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ImagePlus } from "lucide-react";
import MemoReplySection from "./MemoReplySection";

interface MemoDetailClientProps {
	memoId: string;
	initialMemo?: MemoDetail | null;
}

export default function MemoDetailClient({
	memoId,
	initialMemo,
}: MemoDetailClientProps) {
	const {
		router,
		user,
		isAuthLoading,
		memo,
		password,
		setPassword,
		passwordError,
		isVerifying,
		message,
		images,
		isSubmitting,
		isEditOpen,
		setIsEditOpen,
		isReplyEditOpen,
		setIsReplyEditOpen,
		replyMessage,
		setReplyMessage,
		replyImages,
		isReplySubmitting,
		isMounted,
		messageRef,
		isImageModalOpen,
		setIsImageModalOpen,
		imageModalIndex,
		imageModalImages,
		imageDialog,
		assets,
		isOwner,
		requiresPassword,
		requiresSecretAccess,
		canSubmit,
		replies,
		handleVerifyPassword,
		handleImageDialogOpen,
		removeImage,
		removeReplyImage,
		handleImageUpload,
		openEditReply,
		closeEditReply,
		handleUpdateReply,
		handleDeleteReply,
		openImageModal,
		handleMessageChange,
		handleCreateReply,
		handleUpdateMemo,
		handleDeleteMemo,
	} = useMemoDetailController({
		memoId,
		initialMemo,
	});
	const { isAdmin } = useAdmin();

	const contentNode = (() => {
		if (!memo) {
			return null;
		}

		if (requiresSecretAccess) {
			return (
				<div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
					<div className="w-16 h-16 rounded-full bg-card border border-card flex items-center justify-center">
						<Lock size={24} className="text-sub-text" />
					</div>
					<h2 className="mt-4 text-lg font-semibold text-main-text">
						비공개 메모입니다.
					</h2>
					<p className="text-sm text-sub-text mt-2">
						작성자와 관리자만 열람할 수 있습니다.
					</p>
				</div>
			);
		}

		if (requiresPassword) {
			return (
				<div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
					<div className="w-16 h-16 rounded-full bg-card border border-card flex items-center justify-center">
						<Lock size={24} className="text-sub-text" />
					</div>
					<h2 className="mt-4 text-lg font-semibold text-main-text">
						보호된 메모입니다.
					</h2>
					<p className="text-sm text-sub-text mt-2">
						비밀번호를 입력하면 내용을 볼 수 있어요.
					</p>
					<div className="mt-4 flex items-center gap-2">
						<Input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleVerifyPassword();
								}
							}}
							placeholder="비밀번호"
							className="w-48"
						/>
						<Button
							type="button"
							onClick={handleVerifyPassword}
							disabled={isVerifying}
						>
							확인
						</Button>
					</div>
					{passwordError && (
						<p className="mt-2 text-xs text-red-500">{passwordError}</p>
					)}
				</div>
			);
		}

		return (
			<section className="bg-card rounded-card border-card backdrop-blur-card">
				<article className="p-5">
					<div className="flex items-center justify-between text-sm text-sub-text">
						<div className="flex items-center gap-2.5">
							<div className="w-9 h-9 rounded-full overflow-hidden border border-card">
								{memo.author?.avatarUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={memo.author.avatarUrl}
										alt={memo.author?.name ?? "작성자"}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-xs font-medium">
										{memo.author?.name?.charAt(0) ?? "?"}
									</div>
								)}
							</div>
							<span>{memo.author?.name ?? "게스트"}</span>
							<span suppressHydrationWarning>
								{memo.createdAt ? dateTimeConvert(memo.createdAt) : ""}
							</span>
						</div>
						{(isOwner || isAdmin) && (
							<DropdownMenu modal={false}>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className="w-8 h-8 rounded-full flex items-center justify-center text-sub-text hover:text-main-text hover:bg-card-bg"
										aria-label="메모 메뉴"
									>
										<MoreHorizontal size={18} />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
										수정하기
									</DropdownMenuItem>
									<DropdownMenuItem
										className="text-red-400"
										onSelect={handleDeleteMemo}
									>
										삭제하기
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>

					<h1 className="text-xl font-bold text-main-text mt-2.5 font-title">
						{memo.title}
					</h1>

					<div className="text-sm text-main-text whitespace-pre-line leading-relaxed mt-2.5">
						{memo.content}
					</div>

					{memo.imageUrls && (memo.imageUrls?.length ?? 0) > 0 && (
						<div
							className={cn(
								"grid gap-2 mt-4",
								(memo.imageUrls?.length ?? 0) === 1 && "grid-cols-1",
								(memo.imageUrls?.length ?? 0) === 2 && "grid-cols-2",
								(memo.imageUrls?.length ?? 0) >= 3 && "grid-cols-2 grid-rows-2",
							)}
						>
							{memo.imageUrls.slice(0, 4).map((url, index) => (
								<button
									key={`${url}-${index}`}
									type="button"
									onClick={() => openImageModal(memo.imageUrls ?? [], index)}
									className={cn(
										"relative rounded-card border border-card overflow-hidden text-left",
										(memo.imageUrls?.length ?? 0) === 1
											? "aspect-[4/3]"
											: "aspect-square",
										(memo.imageUrls?.length ?? 0) === 3 && index === 0 && "row-span-2",
									)}
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

					{memo.tags && memo.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mt-2.5">
							{memo.tags.map((tag, idx) => (
								<span
									key={idx}
									className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20"
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</article>

				<MemoReplySection
					replies={replies}
					isOwner={isOwner}
					isAuthLoading={isAuthLoading}
					currentUserId={user?.uid}
					message={message}
					images={images}
					isSubmitting={isSubmitting}
					canSubmit={canSubmit}
					messageRef={messageRef}
					onMessageChange={handleMessageChange}
					onCreateReply={handleCreateReply}
					onOpenImageDialog={handleImageDialogOpen}
					onRemoveImage={removeImage}
					onOpenImageModal={openImageModal}
					onOpenEditReply={openEditReply}
					onDeleteReply={handleDeleteReply}
				/>
			</section>
		);
	})();

	return (
		<div className="shrink-0 w-full max-w-xl mt-[90px] mb-[40px] mx-auto">
			{memo && (
				<Button
					variant="default"
					size="sm"
					onClick={() => router.back()}
					className="mb-8 gap-2"
				>
					<ArrowLeft size={16} />
					목록으로
				</Button>
			)}

			{contentNode}

			{isMounted && (
				<ImageUploadDialog
					isOpen={imageDialog.isOpen}
					onOpenChange={imageDialog.setIsOpen}
					thumbnail={imageDialog.previewUrl}
					setThumbnail={imageDialog.setPreview}
					uploadMode="deferred"
					onFileSelect={(file, previewUrl) => {
						imageDialog.setMultipleFiles([file], [previewUrl]);
					}}
					onFilesSelect={(files, previewUrls) => {
						imageDialog.setMultipleFiles(files, previewUrls);
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
			)}
			<Dialog
				open={isReplyEditOpen}
				onOpenChange={(open) => {
					if (!open) {
						closeEditReply();
					} else {
						setIsReplyEditOpen(true);
					}
				}}
			>
				<DialogContent className="max-w-lg w-full bg-card border-card rounded-card backdrop-blur-card text-main-text">
					<DialogHeader>
						<DialogTitle className="text-base font-semibold">
							답글 수정
						</DialogTitle>
						<DialogDescription className="text-xs text-sub-text">
							답글 내용을 수정하고 이미지를 다시 첨부할 수 있어요.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<Textarea
							value={replyMessage}
							onChange={(e) => setReplyMessage(e.target.value)}
							placeholder="메시지를 입력하세요..."
							rows={4}
							className="resize-none"
						/>
						<div className="flex items-center justify-between">
							<button
								type="button"
								onClick={() => handleImageDialogOpen("edit")}
								disabled={isReplySubmitting}
								className={cn(
									"inline-flex items-center justify-center w-8 h-8 rounded-card border border-card bg-card text-main-text",
									isReplySubmitting ? "opacity-60 pointer-events-none" : "",
								)}
								aria-label="사진 첨부"
							>
								<ImagePlus size={14} />
							</button>
							{replyImages.length > 0 && (
								<span className="text-xs text-sub-text">
									{replyImages.length}/4
								</span>
							)}
						</div>
						{replyImages.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{replyImages.slice(0, 4).map((image) => (
									<div
										key={image.id}
										className="relative w-12 h-12 rounded-card border border-card overflow-hidden"
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={image.url}
											alt="첨부 이미지"
											className="absolute inset-0 w-full h-full object-cover"
										/>
										<button
											type="button"
											onClick={() => removeReplyImage(image.id)}
											className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-1"
											aria-label="이미지 삭제"
										>
											<X size={10} />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
					<DialogFooter className="gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={closeEditReply}
						>
							취소
						</Button>
						<Button type="button" onClick={handleUpdateReply}>
							수정
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{memo && (
				<MemoCreateModal
					isOpen={isEditOpen}
					onOpenChange={setIsEditOpen}
					mode="edit"
					initialValues={{
						title: memo.title,
						content: memo.content ?? "",
						tags: memo.tags ?? [],
						visibility: memo.visibility,
						imageUrls: memo.imageUrls ?? [],
					}}
					tagsOptions={memo.tags ?? []}
					onSubmit={handleUpdateMemo}
				/>
			)}
			{imageModalImages.length > 0 && (
				<ImageSlideModal
					isOpen={isImageModalOpen}
					onOpenChange={setIsImageModalOpen}
					images={imageModalImages}
					initialIndex={imageModalIndex}
				/>
			)}
		</div>
	);
}
