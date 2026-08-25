"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { cn } from "@/shared/lib/utils";

interface ThreadAvatarProps {
	src?: string | null;
	name?: string | null;
	className?: string;
}

/**
 * 아바타 — 구글 프로필 사진(lh3.googleusercontent.com)은 referrer 기준
 * 레이트리밋(429)이 걸리므로 no-referrer로 요청하고, 그래도 실패하면
 * 깨진 아이콘 대신 이름 이니셜로 폴백한다.
 */
export default function ThreadAvatar({
	src,
	name,
	className,
}: ThreadAvatarProps) {
	const [failed, setFailed] = useState(false);
	const showImage = Boolean(src) && !failed;

	return (
		<span
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-card bg-card-bg text-xs text-sub-text",
				className,
			)}
		>
			{showImage ? (
				<img
					src={src as string}
					alt=""
					referrerPolicy="no-referrer"
					loading="lazy"
					onError={() => setFailed(true)}
					className="h-full w-full object-cover"
				/>
			) : (
				(name || "?").charAt(0)
			)}
		</span>
	);
}
