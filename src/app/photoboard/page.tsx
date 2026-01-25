import PhotoBoardClient from "./photoboard-client";
import { fetchPhotoboardPosts } from "@/queries/photoboard";

export default async function PhotoBoardPage() {
	try {
		const data = await fetchPhotoboardPosts();
		const initialPosts = data?.items ?? [];
		return <PhotoBoardClient initialPosts={initialPosts} />;
	} catch {
		return <PhotoBoardClient initialPosts={[]} />;
	}
}
