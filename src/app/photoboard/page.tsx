import { Suspense } from "react";
import PhotoBoardClient from "./photoboard-client";
import { fetchPhotoboardPosts } from "@/queries/photoboard";

export default async function PhotoBoardPage() {
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
