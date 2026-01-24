import { Suspense } from "react";
import PhotoBoardClient from "./photoboard-client";
import { fetchPhotoboardPostsServer } from "@/queries/photoboard";

export default async function PhotoBoardPage() {
	// 서버 사이드에서 초기 데이터 fetch
	const { data } = await fetchPhotoboardPostsServer();
	const initialPosts = data?.items ?? [];

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<PhotoBoardClient initialPosts={initialPosts} />
		</Suspense>
	);
}
