"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, MoveLeft, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth/store";
import { type PhotoBoardPost } from "@/data/photoboard";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PhotoboardCreateModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onCreate: (post: PhotoBoardPost) => void;
}

type ComposerStep = "select" | "crop" | "details";

const getInitial = (value: string) => value.trim().charAt(0).toUpperCase();
const normalizeTag = (value: string) => value.trim().replace(/^#/, "");

export default function PhotoboardCreateModal({
	isOpen,
	onOpenChange,
	onCreate,
}: PhotoboardCreateModalProps) {
	const { user, isAuthenticated } = useAuthStore();
	const [step, setStep] = useState<ComposerStep>("select");
	const [rawImageUrl, setRawImageUrl] = useState("");
	const [croppedImageUrl, setCroppedImageUrl] = useState("");
	const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
	const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
	const [captionInput, setCaptionInput] = useState("");
	const [tagInput, setTagInput] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
	const [cropBoxSize, setCropBoxSize] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const cropBoxRef = useRef<HTMLDivElement | null>(null);

	const displayName = user?.displayName || "게스트";
	const avatarUrl = user?.photoURL || "";

	useEffect(() => {
		return () => {
			if (rawImageUrl.startsWith("blob:")) {
				URL.revokeObjectURL(rawImageUrl);
			}
		};
	}, [rawImageUrl]);

	useEffect(() => {
		if (!isOpen) return;
		const updateSize = () => {
			if (!cropBoxRef.current) return;
			setCropBoxSize(cropBoxRef.current.clientWidth);
		};
		updateSize();
		window.addEventListener("resize", updateSize);
		return () => window.removeEventListener("resize", updateSize);
	}, [isOpen, step]);

	useEffect(() => {
		if (!cropBoxSize || !imageSize.width) return;
		setCropOffset({ x: 0, y: 0 });
	}, [cropBoxSize, imageSize]);

	const resetComposer = () => {
		setStep("select");
		setCaptionInput("");
		setTagInput("");
		setTags([]);
		setCroppedImageUrl("");
		setImageSize({ width: 0, height: 0 });
		setCropOffset({ x: 0, y: 0 });
		setIsDragging(false);
		setIsProcessing(false);
		if (rawImageUrl.startsWith("blob:")) {
			URL.revokeObjectURL(rawImageUrl);
		}
		setRawImageUrl("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (rawImageUrl.startsWith("blob:")) {
			URL.revokeObjectURL(rawImageUrl);
		}
		const previewUrl = URL.createObjectURL(file);
		setRawImageUrl(previewUrl);
		setCroppedImageUrl("");
		setStep("select");
		const img = new Image();
		img.onload = () => {
			setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
		};
		img.src = previewUrl;
	};

	const getRenderMetrics = () => {
		if (!cropBoxSize || !imageSize.width || !imageSize.height) return null;
		const scale = Math.max(
			cropBoxSize / imageSize.width,
			cropBoxSize / imageSize.height
		);
		const renderWidth = imageSize.width * scale;
		const renderHeight = imageSize.height * scale;
		const maxOffsetX = Math.max(0, (renderWidth - cropBoxSize) / 2);
		const maxOffsetY = Math.max(0, (renderHeight - cropBoxSize) / 2);
		return { scale, renderWidth, renderHeight, maxOffsetX, maxOffsetY };
	};

	const clampOffset = (next: { x: number; y: number }) => {
		const metrics = getRenderMetrics();
		if (!metrics) return { x: 0, y: 0 };
		return {
			x: Math.min(metrics.maxOffsetX, Math.max(-metrics.maxOffsetX, next.x)),
			y: Math.min(metrics.maxOffsetY, Math.max(-metrics.maxOffsetY, next.y)),
		};
	};

	const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (step !== "crop") return;
		setIsDragging(true);
		setDragStart({ x: event.clientX, y: event.clientY });
		setDragOrigin(cropOffset);
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		const deltaX = event.clientX - dragStart.x;
		const deltaY = event.clientY - dragStart.y;
		setCropOffset(clampOffset({ x: dragOrigin.x + deltaX, y: dragOrigin.y + deltaY }));
	};

	const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		setIsDragging(false);
		event.currentTarget.releasePointerCapture(event.pointerId);
	};

	const handleAddTag = (value: string) => {
		const normalized = normalizeTag(value);
		if (!normalized) return;
		if (tags.includes(normalized)) return;
		if (tags.length >= 5) {
			toast.error("태그는 최대 5개까지 추가할 수 있어요.");
			return;
		}
		setTags((prev) => [...prev, normalized]);
		setTagInput("");
	};

	const handleRemoveTag = (value: string) => {
		setTags((prev) => prev.filter((tag) => tag !== value));
	};

	const generateCroppedImage = async () => {
		const metrics = getRenderMetrics();
		if (!metrics || !rawImageUrl) return "";
		const outputSize = 1080;
		const ratio = outputSize / cropBoxSize;
		const canvas = document.createElement("canvas");
		canvas.width = outputSize;
		canvas.height = outputSize;
		const ctx = canvas.getContext("2d");
		if (!ctx) return "";

		const img = new Image();
		img.src = rawImageUrl;
		await img.decode();
		const renderWidth = metrics.renderWidth * ratio;
		const renderHeight = metrics.renderHeight * ratio;
		const drawX = (outputSize - renderWidth) / 2 + cropOffset.x * ratio;
		const drawY = (outputSize - renderHeight) / 2 + cropOffset.y * ratio;
		ctx.drawImage(img, drawX, drawY, renderWidth, renderHeight);
		return canvas.toDataURL("image/jpeg", 0.9);
	};

	const handleNextStep = async () => {
		if (step === "select") {
			if (!rawImageUrl) {
				toast.error("이미지를 선택해주세요.");
				return;
			}
			setStep("crop");
			return;
		}
		if (step === "crop") {
			setIsProcessing(true);
			try {
				const cropped = await generateCroppedImage();
				if (!cropped) {
					toast.error("이미지 편집에 실패했어요.");
					return;
				}
				setCroppedImageUrl(cropped);
				setStep("details");
			} finally {
				setIsProcessing(false);
			}
		}
	};

	const handleBackStep = () => {
		if (step === "details") {
			setStep("crop");
			return;
		}
		if (step === "crop") {
			setStep("select");
			return;
		}
		onOpenChange(false);
	};

	const handleCreatePost = () => {
		const trimmedCaption = captionInput.trim();
		const finalImageUrl = croppedImageUrl || rawImageUrl;
		if (!finalImageUrl || !trimmedCaption) {
			toast.error("이미지와 본문을 입력해주세요.");
			return;
		}
		if (!isAuthenticated || !user) {
			toast.error("로그인 후 게시할 수 있어요.");
			return;
		}
		const newPost: PhotoBoardPost = {
			id: `pb-${Date.now()}`,
			author: {
				id: user.uid,
				name: displayName,
				avatarUrl,
			},
			createdAt: new Date().toISOString(),
			imageUrl: finalImageUrl,
			caption: trimmedCaption,
			likeCount: 0,
			tags,
		};
		onCreate(newPost);
		resetComposer();
		onOpenChange(false);
	};

	const metrics = getRenderMetrics();
	const isShareDisabled =
		!croppedImageUrl || !captionInput.trim() || !isAuthenticated || isProcessing;
	const isNextDisabled =
		step === "select"
			? !rawImageUrl || isProcessing
			: !rawImageUrl || !metrics || isProcessing;

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				onOpenChange(open);
				if (!open) resetComposer();
			}}
		>
			<DialogContent className="max-w-5xl w-[94vw] bg-card-bg border-card rounded-card p-0 overflow-hidden">
				<div className="flex items-center justify-between border-b border-card px-4 py-3">
					<button
						type="button"
						onClick={handleBackStep}
						className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-card"
						aria-label="뒤로가기"
					>
						<MoveLeft size={18} />
					</button>
					<DialogTitle className="text-sm font-semibold text-main-text">
						{step === "crop" ? "자르기" : "새 게시물 만들기"}
					</DialogTitle>
					{step === "details" ? (
						<button
							type="button"
							onClick={handleCreatePost}
							disabled={isShareDisabled}
							className={cn(
								"text-sm font-semibold",
								isShareDisabled
									? "text-sub-text cursor-not-allowed"
									: "text-theme-primary hover:opacity-80"
							)}
						>
							공유하기
						</button>
					) : (
						<button
							type="button"
							onClick={handleNextStep}
							disabled={isNextDisabled}
							className={cn(
								"text-sm font-semibold",
								isNextDisabled
									? "text-sub-text cursor-not-allowed"
									: "text-theme-primary hover:opacity-80"
							)}
						>
							다음
						</button>
					)}
				</div>
				<DialogDescription className="sr-only">
					포토보드에 새 게시물을 작성합니다.
				</DialogDescription>

				{step === "select" && (
					<div className="flex h-[70vh] min-h-[420px] items-center justify-center bg-card-bg p-6">
						<div className="w-full max-w-[520px] aspect-square border border-dashed border-card text-sub-text rounded-card flex flex-col items-center justify-center gap-4 bg-card">
							<ImagePlus size={42} className="text-sub-text" />
							<p className="text-sm text-sub-text">
								사진과 동영상을 여기에 끌어다 놓으세요
							</p>
							<label className="px-4 py-2 rounded-full bg-theme-primary text-white text-sm cursor-pointer">
								컴퓨터에서 선택
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="hidden"
								/>
							</label>
						</div>
					</div>
				)}

				{step === "crop" && (
					<div className="flex h-[70vh] min-h-[420px] items-center justify-center bg-card-bg p-6">
						<div
							ref={cropBoxRef}
							className="relative w-full max-w-[520px] aspect-square rounded-card overflow-hidden border border-card bg-black"
							onPointerDown={handlePointerDown}
							onPointerMove={handlePointerMove}
							onPointerUp={handlePointerEnd}
							onPointerCancel={handlePointerEnd}
							style={{ cursor: isDragging ? "grabbing" : "grab" }}
						>
							{rawImageUrl && metrics ? (
								<img
									src={rawImageUrl}
									alt="편집할 이미지"
									className="absolute left-1/2 top-1/2 select-none"
									style={{
										width: `${metrics.renderWidth}px`,
										height: `${metrics.renderHeight}px`,
										transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px))`,
									}}
									draggable={false}
								/>
							) : (
								<div className="absolute inset-0 flex items-center justify-center text-sm text-sub-text">
									이미지를 불러오는 중...
								</div>
							)}
							<div className="absolute inset-0 border border-white/40 pointer-events-none" />
							<div className="absolute left-3 bottom-3 text-xs text-white/80 bg-black/50 px-2 py-1 rounded-full">
								드래그해서 위치를 조정하세요
							</div>
						</div>
					</div>
				)}

				{step === "details" && (
					<div className="grid h-[70vh] min-h-[420px] md:grid-cols-[1.4fr_1fr]">
						<div className="flex items-center justify-center bg-card-bg p-6">
							<div className="relative w-full max-w-[520px] aspect-square rounded-card overflow-hidden border border-card">
								<img
									src={croppedImageUrl}
									alt="편집된 이미지"
									className="w-full h-full object-cover"
								/>
							</div>
						</div>
						<div className="border-l border-card bg-card p-6 flex flex-col gap-6">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full overflow-hidden border border-card bg-card-bg flex items-center justify-center">
									{avatarUrl ? (
										<img
											src={avatarUrl}
											alt={displayName}
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-sm font-semibold text-sub-text">
											{getInitial(displayName)}
										</span>
									)}
								</div>
								<div>
									<p className="text-sm font-semibold text-main-text">
										{displayName}
									</p>
									<p className="text-xs text-sub-text">
										오늘의 기록을 남겨주세요.
									</p>
								</div>
							</div>
							<div className="flex-1 space-y-2">
								<p className="text-sm font-semibold text-main-text">본문</p>
								<textarea
									value={captionInput}
									onChange={(event) => setCaptionInput(event.target.value)}
									placeholder="오늘의 순간을 기록해보세요."
									className="resize-none w-full border border-card rounded-card outline-none bg-card-bg text-main-text placeholder:text-sub-text text-sm h-44 p-3"
								/>
								<div className="text-right text-xs text-sub-text">
									{captionInput.length}/200
								</div>
							</div>
							<div className="space-y-3">
								<p className="text-sm font-semibold text-main-text">태그</p>
								<div className="flex items-center gap-2">
									<Input
										value={tagInput}
										onChange={(event) => setTagInput(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												event.preventDefault();
												handleAddTag(tagInput);
											}
										}}
										placeholder="태그를 입력하고 Enter"
										className="bg-card-bg border-card rounded-card"
									/>
									<Button
										type="button"
										variant="outline"
										onClick={() => handleAddTag(tagInput)}
									>
										추가
									</Button>
								</div>
								<div className="flex flex-wrap gap-2">
									{tags.length ? (
										tags.map((tag) => (
											<span
												key={tag}
												className="flex items-center gap-1 text-xs text-theme-primary bg-theme-primary/10 px-2 py-1 rounded-full"
											>
												#{tag}
												<button
													type="button"
													onClick={() => handleRemoveTag(tag)}
													className="text-theme-primary/70 hover:text-theme-primary"
													aria-label={`${tag} 태그 삭제`}
												>
													<X size={12} />
												</button>
											</span>
										))
									) : (
										<span className="text-xs text-sub-text">
											태그를 추가해보세요.
										</span>
									)}
								</div>
							</div>
							{!isAuthenticated && (
								<p className="text-xs text-sub-text">
									로그인 후 게시할 수 있어요.
								</p>
							)}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
