"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/store/auth/store";
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
import { toast } from "sonner";
import {
	createGuestbookEntry,
	deleteGuestbookEntry,
	updateGuestbookEntry,
	fetchGuestbookList,
	verifyGuestbookSecret,
	type GuestbookEntry,
	uploadGuestbookImages,
} from "@/queries/guestbook";
import { ImagePlus, Lock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import GuestbookItem from "@/components/items/GuestbookItem";
import GuestbookEditDialog from "@/components/guestbook/GuestbookEditDialog";
import GuestbookSecretDialog from "@/components/guestbook/GuestbookSecretDialog";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import {
	useGuestbookForm,
	type GuestbookImage,
} from "@/hooks/guestbook/useGuestbookForm";
import { useCooldown } from "@/hooks/guestbook/useCooldown";
import { useImageDialog } from "@/hooks/guestbook/useImageDialog";
import { useAssets } from "@/hooks/guestbook/useAssets";

const DEFAULT_PAGE_SIZE = 10;
const MAX_IMAGE_COUNT = 8;

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
	const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
	const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
	const [totalCount, setTotalCount] = useState(total);
	const [currentPage, setCurrentPage] = useState(1);

	const resolvedMode: "user" | "anon" = isAuthenticated ? "user" : "anon";

	// 폼 상태 관리
	const form = useGuestbookForm({ mode: resolvedMode });
	const { cooldownRemaining, startCooldown } = useCooldown();

	// 다이얼로그 상태
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<"edit" | "delete">("edit");
	const [dialogPin, setDialogPin] = useState("");
	const [dialogMessage, setDialogMessage] = useState("");
	const [dialogImages, setDialogImages] = useState<GuestbookImage[]>([]);
	const [dialogSecret, setDialogSecret] = useState(false);
	const [activeEntry, setActiveEntry] = useState<GuestbookEntry | null>(null);

	const [secretDialogOpen, setSecretDialogOpen] = useState(false);
	const [secretDialogPin, setSecretDialogPin] = useState("");
	const [secretDialogEntry, setSecretDialogEntry] =
		useState<GuestbookEntry | null>(null);
	const [isVerifyingSecret, setIsVerifyingSecret] = useState(false);

	// 이미지 다이얼로그
	const imageDialog = useImageDialog();
	const assets = useAssets(imageDialog.isOpen);

	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

	const canSubmit = form.canSubmit && cooldownRemaining === 0;

	const loadPage = useCallback(async () => {
		try {
			const data = await fetchGuestbookList({
				page: currentPage,
				limit: pageSize,
			});
			setEntries(data.items);
			setTotalCount(data.total);
		} catch {
			// 에러 처리는 선택적
		}
	}, [currentPage, pageSize]);

	const uploadImages = useCallback(async (images: GuestbookImage[]) => {
		const fileImages = images.filter((image) => image.file);
		const uploadedUrls =
			fileImages.length > 0
				? await uploadGuestbookImages(
						fileImages.map((image) => image.file as File),
					)
				: [];

		let uploadIndex = 0;
		return images.reduce<string[]>((acc, image) => {
			if (image.file) {
				const nextUrl = uploadedUrls[uploadIndex];
				uploadIndex += 1;
				if (nextUrl) {
					acc.push(nextUrl);
				}
			} else if (image.url && !image.url.startsWith("blob:")) {
				acc.push(image.url);
			}
			return acc;
		}, []);
	}, []);

	const handleCreate = useCallback(async () => {
		if (!canSubmit) return;
		form.setIsSubmitting(true);
		try {
			const finalImageUrls = await uploadImages(form.images);
			await createGuestbookEntry({
				message: form.message,
				displayName: resolvedMode === "anon" ? form.displayName : undefined,
				pin: resolvedMode === "anon" ? form.pin : undefined,
				isSecret: form.isSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("저장되었습니다.");
			form.resetForm();
			startCooldown();
			setCurrentPage(1);
			await loadPage();
		} catch (error) {
			if (isAxiosError(error)) {
				const serverMessage =
					typeof error.response?.data?.error === "string"
						? error.response?.data?.error
						: null;
				if (serverMessage) {
					toast.error(serverMessage);
					return;
				}
			}
			toast.error("저장에 실패했습니다.");
		} finally {
			form.setIsSubmitting(false);
		}
	}, [canSubmit, form, resolvedMode, uploadImages, startCooldown, loadPage]);

	const handleUpdate = useCallback(async () => {
		if (!activeEntry || !dialogMessage.trim()) return;

		try {
			const finalImageUrls = await uploadImages(dialogImages);
			await updateGuestbookEntry(activeEntry.id, {
				message: dialogMessage,
				pin: activeEntry.authorType === "anon" ? dialogPin : undefined,
				isSecret: dialogSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("저장되었습니다.");
			await loadPage();
		} catch {
			toast.error("저장에 실패했습니다.");
		} finally {
			closeDialog();
		}
	}, [
		activeEntry,
		dialogMessage,
		dialogPin,
		dialogSecret,
		dialogImages,
		uploadImages,
		loadPage,
	]);

	const handleDelete = useCallback(async () => {
		if (!activeEntry) return;
		try {
			await deleteGuestbookEntry(activeEntry.id, {
				pin: activeEntry.authorType === "anon" ? dialogPin : undefined,
			});
			toast.success("삭제되었습니다.");
			await loadPage();
		} catch {
			toast.error("삭제에 실패했습니다.");
		} finally {
			closeDialog();
		}
	}, [activeEntry, dialogPin, loadPage]);

	const openDialog = useCallback(
		(entry: GuestbookEntry, modeType: "edit" | "delete") => {
			const entryImages = entry.displayImageUrls ?? entry.imageUrls ?? [];
			setActiveEntry(entry);
			setDialogMode(modeType);
			setDialogPin("");
			setDialogMessage(entry.displayMessage ?? entry.message ?? "");
			setDialogImages(
				entryImages.map((url) => ({
					id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
					url,
				})),
			);
			setDialogSecret(entry.isSecret === true);
			setDialogOpen(true);
		},
		[],
	);

	const closeDialog = useCallback(() => {
		setDialogOpen(false);
		setActiveEntry(null);
		dialogImages.forEach((image) => {
			if (image.url.startsWith("blob:")) {
				URL.revokeObjectURL(image.url);
			}
		});
		setDialogImages([]);
	}, [dialogImages]);

	const openSecretDialog = useCallback((entry: GuestbookEntry) => {
		setSecretDialogEntry(entry);
		setSecretDialogPin("");
		setSecretDialogOpen(true);
	}, []);

	const closeSecretDialog = useCallback(() => {
		setSecretDialogOpen(false);
		setSecretDialogEntry(null);
		setSecretDialogPin("");
	}, []);

	const handleSecretToggle = useCallback(
		async (entry: GuestbookEntry) => {
			if (entry.masked !== true) return;
			if (!entry.canViewSecret) return;
			openSecretDialog(entry);
		},
		[openSecretDialog],
	);

	const handleVerifySecret = useCallback(async () => {
		if (!secretDialogEntry || !/^\d{4}$/.test(secretDialogPin)) return;
		setIsVerifyingSecret(true);
		try {
			const data = await verifyGuestbookSecret(secretDialogEntry.id, {
				pin: secretDialogPin,
			});
			const resolvedImageUrls = data.imageUrls ?? [];
			setEntries((prev) =>
				prev.map((entry) =>
					entry.id === secretDialogEntry.id
						? {
								...entry,
								message: data.message ?? entry.message,
								imageUrls: resolvedImageUrls,
								displayMessage: data.message ?? entry.displayMessage ?? "",
								displayImageUrls:
									data.imageUrls ?? entry.displayImageUrls ?? [],
								masked: false,
							}
						: entry,
				),
			);
			closeSecretDialog();
		} catch {
			toast.error("비밀번호가 올바르지 않습니다.");
		} finally {
			setIsVerifyingSecret(false);
		}
	}, [secretDialogEntry, secretDialogPin, closeSecretDialog]);

	const removeImageFromTarget = useCallback(
		(target: "create" | "edit", id: string) => {
			const remove = (prev: GuestbookImage[]) => {
				const targetImage = prev.find((image) => image.id === id);
				if (targetImage?.url.startsWith("blob:")) {
					URL.revokeObjectURL(targetImage.url);
				}
				return prev.filter((image) => image.id !== id);
			};

			if (target === "edit") {
				setDialogImages(remove);
			} else {
				form.setImages(remove);
			}
		},
		[form],
	);

	const handleImageDialogOpen = useCallback(
		(target: "create" | "edit") => {
			const currentCount =
				target === "edit" ? dialogImages.length : form.images.length;
			if (!imageDialog.openDialog(target, currentCount)) {
				toast.error("이미지는 최대 8개까지 첨부할 수 있어요.");
			}
		},
		[imageDialog, dialogImages.length, form.images.length],
	);

	const handleImageUpload = useCallback(
		(url: string) => {
			if (!imageDialog.target || !url) return;

			const setter =
				imageDialog.target === "edit" ? setDialogImages : form.setImages;

			if (
				imageDialog.previewFiles.length > 0 &&
				imageDialog.previewUrls.length > 0
			) {
				if (imageDialog.addImagesToTarget(setter)) {
					toast.success("이미지가 추가되었습니다.");
				}
			} else {
				imageDialog.addSingleImageToTarget(setter, url);
				toast.success("이미지가 추가되었습니다.");
			}
		},
		[imageDialog, form],
	);

	// 모드 변경 시 폼 초기화
	useEffect(() => {
		if (resolvedMode === "user") {
			form.setDisplayName("");
			form.setPin("");
		}
	}, [resolvedMode, form]);

	// 페이지 로드
	useEffect(() => {
		if (isAuthLoading) return;
		loadPage();
	}, [isAuthLoading, loadPage]);

	// 컴포넌트 언마운트 시 blob URL 정리
	useEffect(() => {
		return () => {
			form.images.forEach((image) => {
				if (image.url.startsWith("blob:")) {
					URL.revokeObjectURL(image.url);
				}
			});
		};
	}, [form.images]);

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
									form.isSubmitting || form.images.length >= MAX_IMAGE_COUNT
								}
								className={cn(
									"inline-flex items-center justify-center w-9 h-9 rounded-card border border-card bg-card-bg text-main-text",
									form.isSubmitting || form.images.length >= MAX_IMAGE_COUNT
										? "opacity-60 pointer-events-none"
										: "",
								)}
								aria-label="사진 첨부"
							>
								<ImagePlus size={16} />
							</button>
							<span className="text-xs text-sub-text">
								{form.images.length}/{MAX_IMAGE_COUNT}
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
										href="#"
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
												href="#"
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
										href="#"
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
