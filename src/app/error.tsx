"use client";

import { useEffect } from "react";

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function RootError({ error, reset }: ErrorPageProps) {
	useEffect(() => {
		console.error("[RootError]", error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
			<h2 className="text-2xl font-semibold">페이지 오류가 발생했습니다</h2>
			<p className="text-sm text-gray-500 max-w-sm">
				{error.message || "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
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
