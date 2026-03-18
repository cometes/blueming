import PhotoBoardClient from "./photoboard-client";
import { fetchPhotoboardPostsDirect } from "@/features/photoboard/api/serverDirect";

export default async function PhotoBoardPage() {
	try {
		const initialPosts = await fetchPhotoboardPostsDirect();
		return <PhotoBoardClient initialPosts={initialPosts} />;
	} catch {
		return <PhotoBoardClient initialPosts={[]} />;
	}
}
