"use client";

import { ArrowLeft } from "lucide-react";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import type { MemoDetail } from "@/features/memo/types";
import { useMemoDetailController } from "@/features/memo/hooks/useMemoDetailController";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import ImageSlideModal from "@/components/modal/ImageSlideModal";
import MemoCreateModal from "@/features/memo/components/MemoCreateModal";
import MemoReplySection from "./MemoReplySection";
import MemoArticle from "./MemoArticle";
import ReplyEditDialog from "./ReplyEditDialog";
import { MemoPasswordGate, MemoSecretGate } from "./MemoAccessGates";

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
			return <MemoSecretGate />;
		}

		if (requiresPassword) {
			return (
				<MemoPasswordGate
					password={password}
					onPasswordChange={setPassword}
					passwordError={passwordError}
					isVerifying={isVerifying}
					onVerify={handleVerifyPassword}
				/>
			);
		}

		return (
			<section className="bg-card rounded-card border-card backdrop-blur-card">
				<MemoArticle
					memo={memo}
					canManage={isOwner || isAdmin}
					onEdit={() => setIsEditOpen(true)}
					onDelete={handleDeleteMemo}
					onOpenImageModal={openImageModal}
				/>

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
			<ReplyEditDialog
				isOpen={isReplyEditOpen}
				onOpen={() => setIsReplyEditOpen(true)}
				onClose={closeEditReply}
				message={replyMessage}
				onMessageChange={setReplyMessage}
				images={replyImages}
				isSubmitting={isReplySubmitting}
				onOpenImageDialog={() => handleImageDialogOpen("edit")}
				onRemoveImage={removeReplyImage}
				onSubmit={handleUpdateReply}
			/>
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
