"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/store/auth/store";
import { useAdmin } from "@/hooks/auth/UseAdmin";
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
import { ImagePlus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import GuestbookItem from "@/components/items/GuestbookItem";
import GuestbookEditDialog from "@/components/guestbook/GuestbookEditDialog";
import GuestbookSecretDialog from "@/components/guestbook/GuestbookSecretDialog";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import { listStickerAssets } from "@/queries/stickerAssets";
import type { StickerAsset } from "@/types/stickerBoard";

const PIN_REGEX = /^\d{4}$/;
const DEFAULT_PAGE_SIZE = 10;
const COOLDOWN_SECONDS = 20;
const MAX_IMAGE_COUNT = 8;

type GuestbookImage = {
	id: string;
	url: string;
	file?: File;
};

const createImageId = () =>
	`img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
	const { user, isAuthenticated } = useAuthStore();
	const { isAdmin } = useAdmin();
	const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
	const [totalCount, setTotalCount] = useState(total);
	const [currentPage, setCurrentPage] = useState(1);

	const [displayName, setDisplayName] = useState("");
	const [pin, setPin] = useState("");
	const [message, setMessage] = useState("");
	const [images, setImages] = useState<GuestbookImage[]>([]);
	const [isSecret, setIsSecret] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [cooldownUntil, setCooldownUntil] = useState(0);
	const [cooldownRemaining, setCooldownRemaining] = useState(0);
	const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
	const [imageDialogTarget, setImageDialogTarget] = useState<
		"create" | "edit" | null
	>(null);
	const [assets, setAssets] = useState<StickerAsset[]>([]);
	const [assetsLoading, setAssetsLoading] = useState(false);
	const [assetsError, setAssetsError] = useState<string | null>(null);
	const [assetSearchQuery, setAssetSearchQuery] = useState("");

	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<"edit" | "delete">("edit");
	const [dialogPin, setDialogPin] = useState("");
	const [dialogMessage, setDialogMessage] = useState("");
	const [dialogImages, setDialogImages] = useState<GuestbookImage[]>([]);
	const [dialogPreviewUrl, setDialogPreviewUrl] = useState("");
	const [dialogPreviewUrls, setDialogPreviewUrls] = useState<string[]>([]);
	const [dialogPreviewFiles, setDialogPreviewFiles] = useState<File[]>([]);
	const [dialogSecret, setDialogSecret] = useState(false);
	const [activeEntry, setActiveEntry] = useState<GuestbookEntry | null>(null);
	const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>(
		{},
	);
	const [secretDialogOpen, setSecretDialogOpen] = useState(false);
	const [secretDialogPin, setSecretDialogPin] = useState("");
	const [secretDialogEntry, setSecretDialogEntry] =
		useState<GuestbookEntry | null>(null);
	const [isVerifyingSecret, setIsVerifyingSecret] = useState(false);
	const skipDialogPreviewRevokeRef = useRef(false);
	const imagesRef = useRef<GuestbookImage[]>([]);
	const dialogImagesRef = useRef<GuestbookImage[]>([]);
	const dialogPreviewUrlRef = useRef("");
	const dialogPreviewUrlsRef = useRef<string[]>([]);

	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

	const resolvedMode: "user" | "anon" = isAuthenticated ? "user" : "anon";

	const revokeBlobUrl = (url: string) => {
		if (url.startsWith("blob:")) {
			URL.revokeObjectURL(url);
		}
	};

	const clearImageList = (list: GuestbookImage[], setter: (next: GuestbookImage[]) => void) => {
		list.forEach((image) => revokeBlobUrl(image.url));
		setter([]);
	};

	const resetForm = () => {
		setDisplayName("");
		setPin("");
		setMessage("");
		clearImageList(images, setImages);
		setIsSecret(false);
	};

	const filteredAssets = useMemo(() => {
		if (!assetSearchQuery.trim()) return assets;
		const query = assetSearchQuery.trim().toLowerCase();
		return assets.filter((asset) =>
			(asset.name || asset.url || "").toLowerCase().includes(query),
		);
	}, [assets, assetSearchQuery]);

	const canSubmit = useMemo(() => {
		if (!message.trim()) return false;
		if (cooldownRemaining > 0) return false;
		return resolvedMode === "anon"
			? displayName.trim().length > 0 && PIN_REGEX.test(pin)
			: true;
	}, [displayName, message, pin, resolvedMode, cooldownRemaining]);

	const openDialog = (entry: GuestbookEntry, modeType: "edit" | "delete") => {
		const entryImages =
			Array.isArray(entry.imageUrls) && entry.imageUrls.length > 0
				? entry.imageUrls
				: entry.imageUrl
					? [entry.imageUrl]
					: [];
		setActiveEntry(entry);
		setDialogMode(modeType);
		setDialogPin("");
		setDialogMessage(entry.message);
		clearImageList(dialogImages, setDialogImages);
		setDialogImages(
			entryImages.map((url) => ({
				id: createImageId(),
				url,
			})),
		);
		setDialogSecret(entry.isSecret === true);
		setDialogOpen(true);
	};

	const closeDialog = () => {
		setDialogOpen(false);
		setActiveEntry(null);
		clearImageList(dialogImages, setDialogImages);
	};

	const handleCreate = async () => {
		if (!canSubmit) return;
		setIsSubmitting(true);
		try {
			const fileImages = images.filter((image) => image.file);
			const uploadedUrls =
				fileImages.length > 0
					? await uploadGuestbookImages(
							fileImages.map((image) => image.file as File),
						)
					: [];
			let uploadIndex = 0;
			const finalImageUrls = images.reduce<string[]>((acc, image) => {
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
			await createGuestbookEntry({
				message,
				displayName: resolvedMode === "anon" ? displayName : undefined,
				pin: resolvedMode === "anon" ? pin : undefined,
				isSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("저장되었습니다.");
			resetForm();
			const nextCooldown = Date.now() + COOLDOWN_SECONDS * 1000;
			setCooldownUntil(nextCooldown);
			if (typeof window !== "undefined") {
				window.localStorage.setItem(
					"guestbookCooldownUntil",
					String(nextCooldown),
				);
			}
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
			setIsSubmitting(false);
		}
	};

	const handleUpdate = async () => {
		if (!activeEntry) return;
		if (!dialogMessage.trim()) return;

		try {
			const fileImages = dialogImages.filter((image) => image.file);
			const uploadedUrls =
				fileImages.length > 0
					? await uploadGuestbookImages(
							fileImages.map((image) => image.file as File),
						)
					: [];
			let uploadIndex = 0;
			const finalImageUrls = dialogImages.reduce<string[]>((acc, image) => {
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
	};

	const handleDelete = async () => {
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
	};

	const canEditEntry = (entry: GuestbookEntry) => {
		if (isAdmin) return entry.isAdmin === true;
		if (entry.authorType === "anon") return true;
		if (entry.uid && user?.uid) return entry.uid === user.uid;
		return false;
	};

	const canDeleteEntry = (entry: GuestbookEntry) => {
		if (isAdmin) return true;
		if (entry.authorType === "anon") return true;
		if (entry.uid && user?.uid) return entry.uid === user.uid;
		return false;
	};

	const canViewSecretDirectly = (entry: GuestbookEntry) => {
		if (!entry.isSecret) return true;
		if (isAdmin) return true;
		if (entry.authorType === "user") {
			return entry.uid !== undefined && entry.uid === user?.uid;
		}
		return false;
	};

	const canViewSecret = (entry: GuestbookEntry) => {
		if (!entry.isSecret) return false;
		if (canViewSecretDirectly(entry)) return true;
		return entry.authorType === "anon";
	};

	const openSecretDialog = (entry: GuestbookEntry) => {
		setSecretDialogEntry(entry);
		setSecretDialogPin("");
		setSecretDialogOpen(true);
	};

	const closeSecretDialog = () => {
		setSecretDialogOpen(false);
		setSecretDialogEntry(null);
		setSecretDialogPin("");
	};

	const handleSecretToggle = (entry: GuestbookEntry) => {
		const isVisible = !!visibleSecrets[entry.id];
		if (isVisible) {
			setVisibleSecrets((prev) => ({ ...prev, [entry.id]: false }));
			return;
		}

		if (canViewSecretDirectly(entry)) {
			setVisibleSecrets((prev) => ({ ...prev, [entry.id]: true }));
			return;
		}

		if (entry.authorType === "anon") {
			openSecretDialog(entry);
		}
	};

	const handleVerifySecret = async () => {
		if (!secretDialogEntry) return;
		if (!PIN_REGEX.test(secretDialogPin)) return;
		setIsVerifyingSecret(true);
		try {
			const data = await verifyGuestbookSecret(secretDialogEntry.id, {
				pin: secretDialogPin,
			});
			const resolvedImageUrls =
				Array.isArray(data.imageUrls) && data.imageUrls.length > 0
					? data.imageUrls
					: data.imageUrl
						? [data.imageUrl]
						: [];
			setEntries((prev) =>
				prev.map((entry) =>
					entry.id === secretDialogEntry.id
						? {
								...entry,
								message: data.message ?? entry.message,
								imageUrls: resolvedImageUrls.length
									? resolvedImageUrls
									: entry.imageUrls,
								imageUrl:
									typeof data.imageUrl === "undefined"
										? entry.imageUrl
										: data.imageUrl ?? "",
							}
						: entry,
				),
			);
			setVisibleSecrets((prev) => ({
				...prev,
				[secretDialogEntry.id]: true,
			}));
			closeSecretDialog();
		} catch {
			toast.error("비밀번호가 올바르지 않습니다.");
		} finally {
			setIsVerifyingSecret(false);
		}
	};

	const loadPage = useCallback(async () => {
		try {
			const data = await fetchGuestbookList({
				page: currentPage,
				limit: pageSize,
			});
			setEntries(data.items);
			setTotalCount(data.total);
		} catch {}
	}, [currentPage, pageSize]);

	useEffect(() => {
		if (resolvedMode === "user") {
			setDisplayName("");
			setPin("");
		}
	}, [resolvedMode]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const stored = Number(
			window.localStorage.getItem("guestbookCooldownUntil"),
		);
		if (stored && stored > Date.now()) {
			setCooldownUntil(stored);
		}
	}, []);

	useEffect(() => {
		if (!cooldownUntil) {
			setCooldownRemaining(0);
			return;
		}
		const updateRemaining = () => {
			const remaining = Math.max(
				0,
				Math.ceil((cooldownUntil - Date.now()) / 1000),
			);
			setCooldownRemaining(remaining);
			if (remaining === 0 && typeof window !== "undefined") {
				window.localStorage.removeItem("guestbookCooldownUntil");
			}
		};
		updateRemaining();
		const id = window.setInterval(updateRemaining, 1000);
		return () => window.clearInterval(id);
	}, [cooldownUntil]);

	useEffect(() => {
		loadPage();
	}, [loadPage]);

	useEffect(() => {
		imagesRef.current = images;
	}, [images]);

	useEffect(() => {
		dialogImagesRef.current = dialogImages;
	}, [dialogImages]);

	useEffect(() => {
		dialogPreviewUrlRef.current = dialogPreviewUrl;
	}, [dialogPreviewUrl]);

	useEffect(() => {
		dialogPreviewUrlsRef.current = dialogPreviewUrls;
	}, [dialogPreviewUrls]);

	useEffect(() => {
		return () => {
			imagesRef.current.forEach((image) => revokeBlobUrl(image.url));
			dialogImagesRef.current.forEach((image) => revokeBlobUrl(image.url));
			revokeBlobUrl(dialogPreviewUrlRef.current);
			dialogPreviewUrlsRef.current.forEach((url) => revokeBlobUrl(url));
		};
	}, []);

	useEffect(() => {
		if (!isImageDialogOpen) return;
		const loadAssets = async () => {
			try {
				setAssetsLoading(true);
				setAssetsError(null);
				const list = await listStickerAssets("all");
				setAssets(list.filter((asset) => asset.url));
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "에셋을 불러오지 못했습니다.";
				setAssetsError(message);
			} finally {
				setAssetsLoading(false);
			}
		};
		void loadAssets();
	}, [isImageDialogOpen]);

	const activeImageUrl = dialogPreviewUrl;

	const setDialogPreview = (url: string) => {
		if (!url) return;
		if (dialogPreviewUrl.startsWith("blob:") && dialogPreviewUrl !== url) {
			revokeBlobUrl(dialogPreviewUrl);
		}
		dialogPreviewUrls.forEach((previewUrl) => revokeBlobUrl(previewUrl));
		setDialogPreviewUrl(url);
		setDialogPreviewUrls([url]);
		setDialogPreviewFiles([]);
	};

	const handleThumbnailChange = (url: string) => {
		if (!url) return;
		if (dialogPreviewUrl.startsWith("blob:") && dialogPreviewUrl !== url) {
			revokeBlobUrl(dialogPreviewUrl);
		}
		dialogPreviewUrls.forEach((previewUrl) => revokeBlobUrl(previewUrl));
		setDialogPreviewUrl(url);
		setDialogPreviewUrls([url]);
		setDialogPreviewFiles([]);
	};

	const openImageDialog = (target: "create" | "edit") => {
		const currentCount = target === "edit" ? dialogImages.length : images.length;
		if (currentCount >= MAX_IMAGE_COUNT) {
			toast.error("이미지는 최대 8개까지 첨부할 수 있어요.");
			return;
		}
		setImageDialogTarget(target);
		setDialogPreviewUrl("");
		setDialogPreviewUrls([]);
		setDialogPreviewFiles([]);
		setIsImageDialogOpen(true);
	};

	const addImageToTarget = (
		target: "create" | "edit",
		url: string,
		file?: File | null,
	) => {
		if (!url) return;
		const addImage = (prev: GuestbookImage[]) => {
			if (prev.length >= MAX_IMAGE_COUNT) {
				toast.error("이미지는 최대 8개까지 첨부할 수 있어요.");
				return prev;
			}
			return [
				...prev,
				{
					id: createImageId(),
					url,
					file: file ?? undefined,
				},
			];
		};

		if (target === "edit") {
			setDialogImages(addImage);
			return;
		}
		setImages(addImage);
	};

	const removeImageFromTarget = (target: "create" | "edit", id: string) => {
		const remove = (prev: GuestbookImage[]) => {
			const targetImage = prev.find((image) => image.id === id);
			if (targetImage) {
				revokeBlobUrl(targetImage.url);
			}
			return prev.filter((image) => image.id !== id);
		};

		if (target === "edit") {
			setDialogImages(remove);
			return;
		}
		setImages(remove);
	};

	const clearDialogPreview = () => {
		if (!imageDialogTarget) return;
		if (!skipDialogPreviewRevokeRef.current) {
			revokeBlobUrl(dialogPreviewUrl);
			dialogPreviewUrls.forEach((previewUrl) => revokeBlobUrl(previewUrl));
		}
		skipDialogPreviewRevokeRef.current = false;
		setDialogPreviewUrl("");
		setDialogPreviewUrls([]);
		setDialogPreviewFiles([]);
	};

	const handleImageDialogOpenChange = (open: boolean) => {
		setIsImageDialogOpen(open);
		if (!open) {
			clearDialogPreview();
			setImageDialogTarget(null);
			setAssetSearchQuery("");
		}
	};

	return (
		<div className="min-w-[540px] mx-auto mt-[90px] mb-[60px]">
			<h2 className="text-[20px] font-semibold text-main-text">방명록</h2>
			<p className="text-sm text-sub-text mt-2">간단한 메시지를 남겨주세요.</p>
			<section className="bg-card border-card rounded-card p-3 mt-10">
				<div className="space-y-2">
					{resolvedMode === "anon" && (
						<>
							<div className="flex gap-1.5">
								<div className="w-full">
									<p className="text-sm text-sub-text mb-1">name</p>
									<Input
										type="text"
										placeholder="닉네임"
										value={displayName}
										onChange={(e) => setDisplayName(e.target.value)}
										className=""
									/>
								</div>
								<div className="w-full">
									<p className="text-sm text-sub-text mb-1">password</p>
									<Input
										type="password"
										placeholder="비밀번호 4자리"
										inputMode="numeric"
										value={pin}
										onChange={(e) => setPin(e.target.value)}
										className=""
									/>
								</div>
							</div>
						</>
					)}
					<div>
						<p className="text-sm text-sub-text mb-1">message</p>
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="메시지를 입력해주세요"
							maxLength={500}
							className="w-full min-h-[120px] rounded-card border-card bg-card-bg px-4 py-3 text-sm text-main-text resize-none"
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex flex-wrap items-center gap-3">
							<label className="inline-flex items-center gap-2 text-sm text-sub-text">
								<Switch checked={isSecret} onCheckedChange={setIsSecret} />
								<Lock size={14} />
								비밀글
							</label>
							<button
								type="button"
								onClick={() => {
									openImageDialog("create");
								}}
								disabled={isSubmitting || images.length >= MAX_IMAGE_COUNT}
								className={cn(
									"inline-flex items-center justify-center w-9 h-9 rounded-card border border-card bg-card-bg text-main-text",
									isSubmitting || images.length >= MAX_IMAGE_COUNT
										? "opacity-60 pointer-events-none"
										: ""
								)}
								aria-label="사진 첨부"
							>
								<ImagePlus size={16} />
							</button>
							<span className="text-xs text-sub-text">
								{images.length}/{MAX_IMAGE_COUNT}
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
								onClick={handleCreate}
								disabled={!canSubmit || isSubmitting}
							>
								등록하기
							</Button>
						</div>
					</div>

					{images.length > 0 && (
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
							{images.map((image) => (
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
			</section>

			<section className="mt-8">
				<div className="flex items-center justify-between">
					<h3 className="text-base font-semibold text-main-text">
						전체 {totalCount}개
					</h3>
				</div>

				<div className="mt-4 space-y-4">
					{entries.map((entry) => (
						<GuestbookItem
							key={entry.id}
							entry={entry}
							visibleSecret={!!visibleSecrets[entry.id]}
							canViewSecret={canViewSecret(entry)}
							canEdit={canEditEntry(entry)}
							canDelete={canDeleteEntry(entry)}
							onToggleSecret={() => handleSecretToggle(entry)}
							onEdit={() => openDialog(entry, "edit")}
							onDelete={() => openDialog(entry, "delete")}
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
				isAdmin={isAdmin}
				dialogPin={dialogPin}
				onDialogPinChange={setDialogPin}
				dialogMessage={dialogMessage}
				onDialogMessageChange={setDialogMessage}
				dialogSecret={dialogSecret}
				onDialogSecretChange={setDialogSecret}
				dialogImages={dialogImages}
				onRemoveDialogImage={(id) => removeImageFromTarget("edit", id)}
				onOpenImageDialog={() => {
					openImageDialog("edit");
				}}
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
				isOpen={isImageDialogOpen}
				onOpenChange={handleImageDialogOpenChange}
				thumbnail={activeImageUrl}
				setThumbnail={setDialogPreview}
				uploadMode="deferred"
				allowMultiple={true}
				onFilesSelect={(files, previewUrls) => {
					if (dialogPreviewUrl.startsWith("blob:")) {
						revokeBlobUrl(dialogPreviewUrl);
					}
					dialogPreviewUrls.forEach((previewUrl) => revokeBlobUrl(previewUrl));
					setDialogPreviewUrls(previewUrls);
					setDialogPreviewFiles(files);
					setDialogPreviewUrl(previewUrls[0] ?? "");
				}}
				onUpload={(url) => {
					if (!imageDialogTarget || !url) {
						return;
					}
					skipDialogPreviewRevokeRef.current = true;
					if (dialogPreviewFiles.length > 0 && dialogPreviewUrls.length > 0) {
						dialogPreviewUrls.forEach((previewUrl, index) => {
							const file = dialogPreviewFiles[index];
							addImageToTarget(
								imageDialogTarget,
								previewUrl,
								file ?? undefined,
							);
						});
					} else {
						addImageToTarget(imageDialogTarget, url);
					}
					toast.success("이미지가 추가되었습니다.");
				}}
				rightContent={
					<AssetGrid
						assets={filteredAssets}
						loading={assetsLoading}
						error={assetsError}
						selectedUrl={activeImageUrl}
						onSelect={(asset) => handleThumbnailChange(asset.url)}
						aspectClassName="aspect-square"
						imageClassName="w-full h-full object-contain"
						gridTemplateColumns="repeat(3, minmax(0, 1fr))"
					/>
				}
				enableAssetSearch={true}
				assetSearchQuery={assetSearchQuery}
				onAssetSearchChange={setAssetSearchQuery}
			/>
		</div>
	);
}
