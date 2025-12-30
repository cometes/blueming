import { fetchLibraryDetail } from "@/queries/fetch/fetchLibrary";
import DetailClient from "./DetailClient";

export default async function LibararyDetailPage({ params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { data: detailData } = await fetchLibraryDetail(id);

		return <DetailClient detailData={detailData} />;
	} catch {
		return <DetailClient detailData={[]} />;
	}
}
