"use client";

import { useEffect } from "react";

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function GuestbookError({ error, reset }: ErrorPageProps) {
	useEffect(() => {
		console.error("[GuestbookError]", error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
			<h2 className="text-xl font-semibold">방명록을 불러올 수 없습니다</h2>
			<p className="text-sm text-gray-500 max-w-sm">
				{error.message || "방명록을 불러오는 중 오류가 발생했습니다."}
			</p>
			<button
				onClick={reset}
				className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
			>
				다시 시도
			</button>
		</div>
	);
}
