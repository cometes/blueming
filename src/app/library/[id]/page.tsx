import { fetchLibraryDetailDirect } from "@/features/library/api/serverDirect";
import DetailClient from "./DetailClient";

export default async function LibararyDetailPage({ params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const detailData = await fetchLibraryDetailDirect(id);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return <DetailClient detailData={detailData as any} />;
	} catch {
		return <DetailClient detailData={null} />;
	}
}
