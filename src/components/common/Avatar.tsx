"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { cn } from "@/shared/lib/utils";

interface AvatarProps {
	/** 프로필 이미지 URL — 없거나 로드 실패 시 이름 이니셜 폴백 */
	src?: string | null;
	/** 이니셜 폴백에 사용할 표시 이름 */
	name?: string | null;
	alt?: string;
	/** 크기·색상 오버라이드 (기본 h-9 w-9, 폰트 크기는 래퍼에 지정하면 폴백에 상속) */
	className?: string;
}

/**
 * 공용 아바타 — 구글 프로필 사진(lh3.googleusercontent.com)이 referrer 기반
 * 레이트리밋으로 429를 반환해 깨지는 문제를 no-referrer + onError 이니셜 폴백으로 처리
 */
export default function Avatar({
	src,
	name,
	alt = "",
	className,
}: AvatarProps) {
	// src별로 실패를 기억 — src가 바뀌면(다른 사용자) 자동으로 다시 시도
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	const showImage = Boolean(src) && src !== failedSrc;

	return (
		<span
			className={cn(
				"flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-card bg-card-bg text-xs font-medium text-sub-text",
				className,
			)}
		>
			{showImage ? (
				<img
					src={src as string}
					alt={alt}
					referrerPolicy="no-referrer"
					className="h-full w-full object-cover"
					onError={() => setFailedSrc(src ?? null)}
				/>
			) : (
				(name?.trim() || "?").charAt(0).toUpperCase()
			)}
		</span>
	);
}
