"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	ChevronRight,
	X,
	Download,
	Link as LinkIcon,
	ImageOff,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { GalleryImage } from "@/types/gallery";
import { cn } from "@/lib/utils";

interface GalleryImageModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	images: GalleryImage[];
	initialIndex?: number;
	onIndexChange?: (index: number) => void;
}

export default function GalleryImageModal({
	isOpen,
	onOpenChange,
	images,
	initialIndex = 0,
	onIndexChange,
}: GalleryImageModalProps) {
	const [activeIndex, setActiveIndex] = useState(initialIndex);
	const [isLoaded, setIsLoaded] = useState(false);
	const [isError, setIsError] = useState(false);
	const [direction, setDirection] = useState(0);

	const currentImage = images[activeIndex];

	// 인덱스 초기화
	useEffect(() => {
		if (!isOpen) return;
		const nextIndex =
			images.length === 0
				? 0
				: Math.min(Math.max(initialIndex, 0), images.length - 1);
		setActiveIndex(nextIndex);
		setIsLoaded(false);
		setIsError(false);
	}, [isOpen, images.length, initialIndex]);

	// 인덱스 변경 시 콜백
	useEffect(() => {
		if (isOpen && onIndexChange) {
			onIndexChange(activeIndex);
		}
	}, [activeIndex, isOpen, onIndexChange]);

	const handlePrev = useCallback(() => {
		if (images.length === 0) return;
		setDirection(-1);
		setIsLoaded(false);
		setIsError(false);
		setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
	}, [images.length]);

	const handleNext = useCallback(() => {
		if (images.length === 0) return;
		setDirection(1);
		setIsLoaded(false);
		setIsError(false);
		setActiveIndex((prev) => (prev + 1) % images.length);
	}, [images.length]);

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
				className="max-w-4xl w-[95vw] h-[90vh] bg-black/95 border-none p-0 overflow-hidden flex flex-col"
				showCloseButton={false}
			>
				{/* 헤더 */}
				<div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm">
					<div className="flex items-center gap-2">
						<span className="text-white/80 text-sm">
							{activeIndex + 1} / {images.length}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-white hover:bg-white/10"
							onClick={handleCopyLink}
							title="링크 복사"
						>
							<LinkIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-white hover:bg-white/10"
							onClick={handleDownload}
							title="다운로드"
						>
							<Download className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-white hover:bg-white/10"
							onClick={() => onOpenChange(false)}
							title="닫기"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
				</div>

				{/* 이미지 영역 */}
				<div className="relative flex-1 flex items-center justify-center overflow-hidden">
					<AnimatePresence initial={false} custom={direction}>
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
							className="absolute inset-0 flex items-center justify-center p-4"
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
										"max-w-full max-h-full object-contain transition-opacity duration-300",
										isLoaded ? "opacity-100" : "opacity-0"
									)}
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
				<div className="px-6 py-4 bg-black/50 backdrop-blur-sm">
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
