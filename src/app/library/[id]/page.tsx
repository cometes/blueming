import { fetchLibraryDetailServer } from "@/queries/fetch/fetchLibraryServer";
import DetailClient from "./DetailClient";

export default async function LibararyDetailPage({ params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { data: detailData } = await fetchLibraryDetailServer(id);

		return <DetailClient detailData={detailData} />;
	} catch {
		return <DetailClient detailData={[]} />;
	}
}
