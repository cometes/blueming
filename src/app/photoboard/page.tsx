import { Suspense } from "react";
import PhotoBoardClient from "./photoboard-client";
import { fetchPhotoboardPosts } from "@/queries/photoboard";

export default async function PhotoBoardPage() {
	// 서버 사이드에서 초기 데이터 fetch
	try {
		const data = await fetchPhotoboardPosts();
		const initialPosts = data?.items ?? [];

		return (
			<Suspense fallback={<div>Loading...</div>}>
				<PhotoBoardClient initialPosts={initialPosts} />
			</Suspense>
		);
	} catch {
		return (
			<Suspense fallback={<div>Loading...</div>}>
				<PhotoBoardClient initialPosts={[]} />
			</Suspense>
		);
	}
}
