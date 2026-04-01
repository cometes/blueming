"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	ChevronRight,
	X,
	Download,
	Link as LinkIcon,
	ImageOff,
	Pencil,
	Trash2,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { GalleryImage } from "@/features/gallery/types";
import { cn } from "@/shared/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface GalleryImageModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	images: GalleryImage[];
	initialIndex?: number;
	onIndexChange?: (index: number) => void;
	canManage?: (image: GalleryImage) => boolean;
	onEdit?: (image: GalleryImage) => void;
	onDelete?: (image: GalleryImage) => void;
}

export default function GalleryImageModal({
	isOpen,
	onOpenChange,
	images,
	initialIndex = 0,
	onIndexChange,
	canManage,
	onEdit,
	onDelete,
}: GalleryImageModalProps) {
	const [activeIndex, setActiveIndex] = useState(initialIndex);
	const [isLoaded, setIsLoaded] = useState(false);
	const [isError, setIsError] = useState(false);
	const [direction, setDirection] = useState(0);

	// 내부 네비게이션 중인지 추적 (외부 initialIndex 변경과 구분)
	const isNavigating = useRef(false);

	const currentImage = images[activeIndex];

	// 모달이 열릴 때 initialIndex로 동기화
	useEffect(() => {
		if (!isOpen) return;
		// 내부 네비게이션 중이면 initialIndex 무시
		if (isNavigating.current) {
			isNavigating.current = false;
			return;
		}

		const clampedIndex =
			images.length === 0
				? 0
				: Math.min(Math.max(initialIndex, 0), images.length - 1);

		if (clampedIndex !== activeIndex) {
			setActiveIndex(clampedIndex);
			setIsLoaded(false);
			setIsError(false);
		}
	}, [isOpen, initialIndex, images.length, activeIndex]);

	// 모달이 닫힐 때 네비게이션 플래그만 리셋 (isLoaded는 유지하여 닫힘 애니메이션 중 스피너 방지)
	useEffect(() => {
		if (!isOpen) {
			isNavigating.current = false;
		}
	}, [isOpen]);

	const navigateTo = useCallback(
		(newIndex: number, dir: number) => {
			if (images.length === 0) return;

			isNavigating.current = true;
			setDirection(dir);
			setIsLoaded(false);
			setIsError(false);
			setActiveIndex(newIndex);

			// 부모에게 인덱스 변경 알림
			onIndexChange?.(newIndex);
		},
		[images.length, onIndexChange],
	);

	const handlePrev = useCallback(() => {
		if (images.length === 0) return;
		const newIndex = (activeIndex - 1 + images.length) % images.length;
		navigateTo(newIndex, -1);
	}, [activeIndex, images.length, navigateTo]);

	const handleNext = useCallback(() => {
		if (images.length === 0) return;
		const newIndex = (activeIndex + 1) % images.length;
		navigateTo(newIndex, 1);
	}, [activeIndex, images.length, navigateTo]);

	// 키보드 네비게이션
	useEffect(() => {
		if (!isOpen || images.length <= 1) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				handlePrev();
			}
			if (event.key === "ArrowRight") {
				event.preventDefault();
				handleNext();
			}
			if (event.key === "Escape") {
				event.preventDefault();
				onOpenChange(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, images.length, handlePrev, handleNext, onOpenChange]);

	// 링크 복사
	const handleCopyLink = async () => {
		if (!currentImage) return;
		const url = `${window.location.origin}${window.location.pathname}?imgId=${currentImage.id}`;
		try {
			await navigator.clipboard.writeText(url);
			toast.success("링크가 복사되었습니다");
		} catch {
			toast.error("링크 복사에 실패했습니다");
		}
	};

	// 이미지 다운로드
	const handleDownload = async () => {
		if (!currentImage) return;
		try {
			const response = await fetch(currentImage.src);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${currentImage.title || "image"}.jpg`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			toast.success("이미지가 다운로드되었습니다");
		} catch {
			toast.error("다운로드에 실패했습니다");
		}
	};

	// 슬라이드 애니메이션 variants
	const slideVariants = {
		enter: (direction: number) => ({
			x: direction > 0 ? 300 : -300,
			opacity: 0,
		}),
		center: {
			zIndex: 1,
			x: 0,
			opacity: 1,
		},
		exit: (direction: number) => ({
			zIndex: 0,
			x: direction < 0 ? 300 : -300,
			opacity: 0,
		}),
	};

	if (!currentImage) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-3xl md:max-w-3xl sm:max-w-2xl border-none p-0 overflow-hidden flex flex-col bg-card border-card rounded-card backdrop-blur-card h-[60vh] sm:h-[80vh] gap-0"
				showCloseButton={false}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
				}}
			>
				<VisuallyHidden asChild>
					<DialogTitle>갤러리 이미지 상세보기</DialogTitle>
				</VisuallyHidden>
				<VisuallyHidden asChild>
					<DialogDescription>
						갤러리 이미지 상세보기 모달입니다. 좌우 버튼으로 이동할 수 있습니다.
					</DialogDescription>
				</VisuallyHidden>
				{/* 헤더 */}
				<div className="flex items-center justify-between px-4 py-3 bg-black/40">
					<div className="flex items-center gap-2">
						<span className="text-main-text text-sm">
							{activeIndex + 1} / {images.length}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-main-text hover:bg-white/10"
							onClick={handleCopyLink}
							title="링크 복사"
						>
							<LinkIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-main-text hover:bg-white/10"
							onClick={handleDownload}
							title="다운로드"
						>
							<Download className="h-5 w-5" />
						</Button>
						{canManage?.(currentImage) && (
							<>
								<Button
									variant="ghost"
									size="icon"
									className="text-main-text hover:bg-white/10"
									onClick={() => onEdit?.(currentImage)}
									title="수정"
								>
									<Pencil className="h-5 w-5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="text-main-text hover:bg-red-400/20 text-red-400"
									onClick={() => onDelete?.(currentImage)}
									title="삭제"
								>
									<Trash2 className="h-5 w-5" />
								</Button>
							</>
						)}
						<Button
							variant="ghost"
							size="icon"
							className="text-main-text hover:bg-white/10"
							onClick={() => onOpenChange(false)}
							title="닫기"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
				</div>

				{/* 이미지 영역 */}
				<div className="relative flex-1 w-full overflow-hidden">
					<AnimatePresence initial={false} custom={direction} mode="wait">
						<motion.div
							key={activeIndex}
							custom={direction}
							variants={slideVariants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{
								x: { type: "spring", stiffness: 300, damping: 30 },
								opacity: { duration: 0.2 },
							}}
							className="absolute inset-0 flex items-center justify-center"
						>
							{/* 로딩 스켈레톤 */}
							{!isLoaded && !isError && (
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="w-16 h-16 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
								</div>
							)}

							{/* 에러 상태 */}
							{isError ? (
								<div className="flex flex-col items-center justify-center text-white/60">
									<ImageOff size={48} className="mb-3" />
									<span>이미지를 불러올 수 없습니다</span>
								</div>
							) : (
								/* eslint-disable-next-line @next/next/no-img-element */
								<img
									src={currentImage.src}
									alt={currentImage.title}
									className={cn(
										"w-full h-full object-contain transition-opacity duration-300",
										isLoaded ? "opacity-100" : "opacity-0",
									)}
									style={{ display: "block" }}
									onLoad={() => setIsLoaded(true)}
									onError={() => setIsError(true)}
								/>
							)}
						</motion.div>
					</AnimatePresence>

					{/* 네비게이션 버튼 */}
					{images.length > 1 && (
						<>
							<button
								type="button"
								onClick={handlePrev}
								className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
								aria-label="이전 이미지"
							>
								<ChevronLeft size={24} />
							</button>
							<button
								type="button"
								onClick={handleNext}
								className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
								aria-label="다음 이미지"
							>
								<ChevronRight size={24} />
							</button>
						</>
					)}
				</div>

				{/* 푸터 - 이미지 정보 */}
				<div className="px-6 py-4 bg-black/40">
					<h3 className="text-white font-semibold text-lg">
						{currentImage.title}
					</h3>
					{currentImage.category && (
						<p className="text-white/60 text-sm mt-1">
							{currentImage.category}
						</p>
					)}
					{currentImage.description && (
						<p className="text-white/80 text-sm mt-2">
							{currentImage.description}
						</p>
					)}
					{currentImage.tags && currentImage.tags.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-3">
							{currentImage.tags.map((tag, index) => (
								<span
									key={index}
									className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/70"
								>
									#{tag}
								</span>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
