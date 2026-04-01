"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageSlideModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	images: string[];
	initialIndex?: number;
}

export default function ImageSlideModal({
	isOpen,
	onOpenChange,
	images,
	initialIndex = 0,
}: ImageSlideModalProps) {
	const [activeIndex, setActiveIndex] = useState(initialIndex);

	useEffect(() => {
		if (!isOpen) return;
		const nextIndex =
			images.length === 0
				? 0
				: Math.min(Math.max(initialIndex, 0), images.length - 1);
		setActiveIndex(nextIndex);
	}, [isOpen, images.length, initialIndex]);

	const handlePrev = useCallback(() => {
		if (images.length === 0) return;
		setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
	}, [images.length]);

	const handleNext = useCallback(() => {
		if (images.length === 0) return;
		setActiveIndex((prev) => (prev + 1) % images.length);
	}, [images.length]);

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
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, images.length, handlePrev, handleNext]);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-3xl md:max-w-3xl sm:max-w-2xl bg-card border-card rounded-card backdrop-blur-card p-0 overflow-hidden h-[60vh] sm:h-[80vh]"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<div className="relative w-full">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={images[activeIndex]}
						alt="첨부 이미지 확대"
						className="absolute inset-0 w-full h-full object-contain"
					/>
					{images.length > 1 && (
						<>
							<button
								type="button"
								onClick={handlePrev}
								className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
								aria-label="이전 이미지"
							>
								<ChevronLeft size={18} />
							</button>
							<button
								type="button"
								onClick={handleNext}
								className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
								aria-label="다음 이미지"
							>
								<ChevronRight size={18} />
							</button>
						</>
					)}
					<div className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white text-xs px-2 py-1">
						{images.length === 0 ? 0 : activeIndex + 1} / {images.length}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
