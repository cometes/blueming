/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";

interface WidgetImageProps {
	slotIndex: number;
}

const MAX_SLOTS = 4;
const DEFAULT_FIT: "cover" | "contain" = "cover";

const normalizeImages = (images?: string[]) => {
	const next = Array.isArray(images) ? [...images] : [];
	if (next.length >= MAX_SLOTS) return next.slice(0, MAX_SLOTS);
	return [...next, ...Array.from({ length: MAX_SLOTS - next.length }, () => "")];
};

const normalizeFits = (fits?: Array<"cover" | "contain">) => {
	const next = Array.isArray(fits) ? [...fits] : [];
	if (next.length >= MAX_SLOTS) return next.slice(0, MAX_SLOTS);
	return [
		...next,
		...Array.from({ length: MAX_SLOTS - next.length }, () => DEFAULT_FIT),
	];
};

export default function WidgetImage({ slotIndex }: WidgetImageProps) {
	const { main } = useSettings();
	const images = useMemo(
		() => normalizeImages(main?.imageWidget?.images),
		[main?.imageWidget?.images]
	);
	const fits = useMemo(
		() => normalizeFits(main?.imageWidget?.fits),
		[main?.imageWidget?.fits]
	);
	const imageUrl = images[slotIndex] || "";
	const fit = fits[slotIndex] || DEFAULT_FIT;

	if (!imageUrl) {
		return <div className="w-full h-full" aria-hidden="true" />;
	}

	return (
		<img
			src={imageUrl}
			alt={`이미지 위젯 ${slotIndex + 1}`}
			className={`w-full h-full ${
				fit === "contain" ? "object-contain" : "object-cover"
			}`}
			draggable={false}
		/>
	);
}
