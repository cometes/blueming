"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/store/auth/store";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/queries/guestbook";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Lock, Pencil, Trash2, ShieldCheck, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const PIN_REGEX = /^\d{4}$/;
const DEFAULT_PAGE_SIZE = 10;
const COOLDOWN_SECONDS = 20;

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
	const [imageUrl, setImageUrl] = useState("");
	const [isSecret, setIsSecret] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [cooldownUntil, setCooldownUntil] = useState(0);
	const [cooldownRemaining, setCooldownRemaining] = useState(0);
	const { uploadFile, state: uploadState, reset: resetUpload } = useFileUpload();
	const fileInputId = "guestbook-image-upload";
	const dialogFileInputId = "guestbook-image-edit";

	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<"edit" | "delete">("edit");
	const [dialogPin, setDialogPin] = useState("");
	const [dialogMessage, setDialogMessage] = useState("");
	const [dialogImageUrl, setDialogImageUrl] = useState("");
	const [dialogSecret, setDialogSecret] = useState(false);
	const [activeEntry, setActiveEntry] = useState<GuestbookEntry | null>(null);
	const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
	const [secretDialogOpen, setSecretDialogOpen] = useState(false);
	const [secretDialogPin, setSecretDialogPin] = useState("");
	const [secretDialogEntry, setSecretDialogEntry] = useState<GuestbookEntry | null>(
		null
	);
	const [isVerifyingSecret, setIsVerifyingSecret] = useState(false);

	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

	const resolvedMode: "user" | "anon" = isAuthenticated ? "user" : "anon";

	const resetForm = () => {
		setDisplayName("");
		setPin("");
		setMessage("");
		setImageUrl("");
		setIsSecret(false);
		resetUpload();
	};

	const canSubmit = useMemo(() => {
		if (!message.trim()) return false;
		if (cooldownRemaining > 0) return false;
		return resolvedMode === "anon"
			? displayName.trim().length > 0 && PIN_REGEX.test(pin)
			: true;
	}, [displayName, message, pin, resolvedMode, cooldownRemaining]);

	const openDialog = (entry: GuestbookEntry, modeType: "edit" | "delete") => {
		setActiveEntry(entry);
		setDialogMode(modeType);
		setDialogPin("");
		setDialogMessage(entry.message);
		setDialogImageUrl(entry.imageUrl || "");
		setDialogSecret(entry.isSecret === true);
		setDialogOpen(true);
	};

	const closeDialog = () => {
		setDialogOpen(false);
		setActiveEntry(null);
	};

	const handleCreate = async () => {
		if (!canSubmit) return;
		setIsSubmitting(true);
		try {
			await createGuestbookEntry({
				message,
				displayName: resolvedMode === "anon" ? displayName : undefined,
				pin: resolvedMode === "anon" ? pin : undefined,
				isSecret,
				imageUrl,
			});
			toast.success("저장되었습니다.");
			resetForm();
			const nextCooldown = Date.now() + COOLDOWN_SECONDS * 1000;
			setCooldownUntil(nextCooldown);
			if (typeof window !== "undefined") {
				window.localStorage.setItem(
					"guestbookCooldownUntil",
					String(nextCooldown)
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
			await updateGuestbookEntry(activeEntry.id, {
				message: dialogMessage,
				pin: activeEntry.authorType === "anon" ? dialogPin : undefined,
				isSecret: dialogSecret,
				imageUrl: dialogImageUrl,
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
			setEntries((prev) =>
				prev.map((entry) =>
					entry.id === secretDialogEntry.id
						? {
								...entry,
								message: data.message ?? entry.message,
								imageUrl:
									typeof data.imageUrl === "undefined"
										? entry.imageUrl
										: data.imageUrl,
						  }
						: entry
				)
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
		} catch {
		}
	}, [currentPage, pageSize]);

	useEffect(() => {
		if (resolvedMode === "user") {
			setDisplayName("");
			setPin("");
		}
	}, [resolvedMode]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const stored = Number(window.localStorage.getItem("guestbookCooldownUntil"));
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
				Math.ceil((cooldownUntil - Date.now()) / 1000)
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

	return (
		<div className="min-w-[500px] mx-auto mt-[90px] mb-[60px]">
			<section className="bg-card border-card rounded-card p-3">
				<h2 className="text-[20px] font-semibold text-main-text">방명록</h2>
				<p className="text-sm text-sub-text mt-2">
					간단한 메시지를 남겨주세요.
				</p>

				<div className="mt-6 space-y-4">
					{resolvedMode === "anon" && (
						<div className="flex flex-wrap gap-3">
							<input
								type="text"
								placeholder="닉네임"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								className="flex-1 min-w-[140px] rounded-card border-card bg-card-bg px-3 py-2 text-sm text-main-text"
							/>
							<input
								type="password"
								placeholder="비밀번호 4자리"
								inputMode="numeric"
								value={pin}
								onChange={(e) => setPin(e.target.value)}
								className="w-40 rounded-card border-card bg-card-bg px-3 py-2 text-sm text-main-text"
							/>
						</div>
					)}

					<textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder="메시지를 입력해주세요"
						maxLength={500}
						className="w-full min-h-[120px] rounded-card border-card bg-card-bg px-4 py-3 text-sm text-main-text resize-none"
					/>

					<div className="flex items-center justify-between">
						<div className="flex flex-wrap items-center gap-3">
							<label className="inline-flex items-center gap-2 text-sm text-sub-text">
								<input
									type="checkbox"
									checked={isSecret}
									onChange={(e) => setIsSecret(e.target.checked)}
									className="accent-theme-primary"
								/>
								<Lock size={14} />
								비밀글
							</label>
							<label
								htmlFor={fileInputId}
								className={cn(
									"inline-flex items-center justify-center w-9 h-9 rounded-card border border-card bg-card-bg text-main-text cursor-pointer",
									uploadState.loading ? "opacity-60 pointer-events-none" : ""
								)}
								aria-label="사진 첨부"
							>
								<Camera size={16} />
							</label>
							{cooldownRemaining > 0 && (
								<span className="text-xs text-sub-text">
									{cooldownRemaining}초 후에 다시 작성할 수 있어요.
								</span>
							)}
						</div>
						<input
							id={fileInputId}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={async (e) => {
								const file = e.target.files?.[0];
								if (!file) return;
								try {
									const url = await uploadFile(file);
									setImageUrl(url);
									toast.success("이미지가 업로드되었습니다.");
								} catch (error) {
									const message =
										error instanceof Error
											? error.message
											: "이미지 업로드에 실패했습니다.";
									toast.error(message);
								}
							}}
						/>
						<div className="flex items-center gap-2">
							{imageUrl && (
								<button
									type="button"
									onClick={() => setImageUrl("")}
									className="text-xs text-sub-text hover:text-theme-primary"
								>
									삭제
								</button>
							)}
							<Button
								type="button"
								onClick={handleCreate}
								disabled={!canSubmit || isSubmitting}
							>
								등록하기
							</Button>
						</div>
					</div>

					{imageUrl && (
						<div className="rounded-card border-card bg-card-bg p-3">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={imageUrl}
								alt="첨부 이미지"
								className="w-full max-h-60 object-cover rounded-card"
							/>
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
						<div
							key={entry.id}
							className="rounded-card border-card bg-card-bg px-4 py-4"
						>
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
										{entry.isSecret ? (
											<div className="flex flex-wrap items-center gap-2">
												<span className="text-sm text-sub-text">
													비밀글입니다.
												</span>
												{canViewSecret(entry) && (
													<button
														type="button"
														onClick={() => handleSecretToggle(entry)}
														className="text-xs text-theme-primary hover:opacity-70"
													>
														{visibleSecrets[entry.id] ? "숨기기" : "보기"}
													</button>
												)}
											</div>
										) : (
											<p className="text-sm text-sub-text break-words">
												{entry.message}
											</p>
										)}
										{entry.isSecret && visibleSecrets[entry.id] && (
											<p className="mt-2 text-sm text-sub-text break-words">
												{entry.message}
											</p>
										)}
										{entry.imageUrl &&
											(!entry.isSecret || visibleSecrets[entry.id]) && (
												<div className="mt-3 rounded-card border-card bg-card-bg p-2">
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img
														src={entry.imageUrl}
														alt="첨부 이미지"
														className="w-full max-h-60 object-cover rounded-card"
													/>
												</div>
											)}
									</div>
									{entry.createdAt && (
										<p className="mt-2 text-xs text-sub-text">
											{new Date(entry.createdAt).toLocaleString()}
										</p>
									)}
								</div>
								{(canEditEntry(entry) || canDeleteEntry(entry)) && (
									<div className="flex items-center gap-2 shrink-0">
										{canEditEntry(entry) && (
											<Button
												type="button"
												size="sm"
												variant="ghost"
												onClick={() => openDialog(entry, "edit")}
												className="w-9 h-9 p-0"
											>
												<Pencil size={14} />
											</Button>
										)}
										{canDeleteEntry(entry) && (
											<Button
												type="button"
												size="sm"
												variant="ghost"
												onClick={() => openDialog(entry, "delete")}
												className="w-9 h-9 p-0"
											>
												<Trash2 size={14} />
											</Button>
										)}
									</div>
								)}
							</div>
						</div>
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
											setCurrentPage((prev) =>
												Math.min(totalPages, prev + 1)
											);
										}}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</section>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{dialogMode === "edit" ? "방명록 수정" : "방명록 삭제"}
						</DialogTitle>
						<DialogDescription>
							{dialogMode === "edit"
								? "내용을 수정하고 저장하세요."
								: "정말 이 방명록을 삭제할까요?"}
						</DialogDescription>
					</DialogHeader>

					{activeEntry?.authorType === "anon" && !isAdmin && (
						<input
							type="password"
							placeholder="비밀번호 4자리"
							inputMode="numeric"
							value={dialogPin}
							onChange={(e) => setDialogPin(e.target.value)}
							className="w-full rounded-card border-card bg-card-bg px-3 py-2 text-sm text-main-text"
						/>
					)}

							{dialogMode === "edit" && (
								<>
									<textarea
										value={dialogMessage}
										onChange={(e) => setDialogMessage(e.target.value)}
										maxLength={500}
										className="w-full min-h-[120px] rounded-card border-card bg-card-bg px-3 py-2 text-sm text-main-text resize-none"
									/>
									<label className="inline-flex items-center gap-2 text-sm text-sub-text mt-2">
										<input
											type="checkbox"
											checked={dialogSecret}
											onChange={(e) => setDialogSecret(e.target.checked)}
											className="accent-theme-primary"
										/>
										<Lock size={14} />
										비밀글
									</label>
									<div className="flex flex-wrap items-center gap-3 mt-3">
										<label
											htmlFor={dialogFileInputId}
											className={cn(
												"inline-flex items-center justify-center w-9 h-9 rounded-card border border-card bg-card-bg text-main-text cursor-pointer",
												uploadState.loading ? "opacity-60 pointer-events-none" : ""
											)}
											aria-label="사진 변경"
										>
											<Camera size={16} />
										</label>
										<input
											id={dialogFileInputId}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={async (e) => {
												const file = e.target.files?.[0];
												if (!file) return;
												try {
													const url = await uploadFile(file);
													setDialogImageUrl(url);
													toast.success("이미지가 업로드되었습니다.");
												} catch (error) {
													const message =
														error instanceof Error
															? error.message
															: "이미지 업로드에 실패했습니다.";
													toast.error(message);
												}
											}}
										/>
										{dialogImageUrl && (
											<button
												type="button"
												onClick={() => setDialogImageUrl("")}
												className="text-xs text-sub-text hover:text-theme-primary"
											>
												삭제
											</button>
										)}
									</div>
									{dialogImageUrl && (
										<div className="rounded-card border-card bg-card-bg p-2 mt-2">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={dialogImageUrl}
												alt="첨부 이미지"
												className="w-full max-h-60 object-cover rounded-card"
											/>
										</div>
									)}
								</>
							)}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={closeDialog}>
							취소
						</Button>
						{dialogMode === "edit" ? (
							<Button
								type="button"
								onClick={handleUpdate}
								disabled={
									activeEntry?.authorType === "anon" && !isAdmin
										? !PIN_REGEX.test(dialogPin)
										: false
								}
							>
								저장
							</Button>
						) : (
							<Button
								type="button"
								variant="destructive"
								onClick={handleDelete}
								disabled={
									activeEntry?.authorType === "anon" && !isAdmin
										? !PIN_REGEX.test(dialogPin)
										: false
								}
							>
								삭제
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={secretDialogOpen}
				onOpenChange={(open) => {
					if (open) {
						setSecretDialogOpen(true);
					} else {
						closeSecretDialog();
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>비밀글 보기</DialogTitle>
						<DialogDescription>
							비밀번호 4자리를 입력하면 내용을 확인할 수 있습니다.
						</DialogDescription>
					</DialogHeader>
					<input
						type="password"
						placeholder="비밀번호 4자리"
						inputMode="numeric"
						value={secretDialogPin}
						onChange={(e) => setSecretDialogPin(e.target.value)}
						className="w-full rounded-card border-card bg-card-bg px-3 py-2 text-sm text-main-text"
					/>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={closeSecretDialog}>
							취소
						</Button>
						<Button
							type="button"
							onClick={handleVerifySecret}
							disabled={!PIN_REGEX.test(secretDialogPin) || isVerifyingSecret}
						>
							보기
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
