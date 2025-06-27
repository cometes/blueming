import { fetchLibraryDetail } from "@/queries/fetch/fetchLibrary";
import DetailClient from "./DetailClient";

export default async function LibararyDetailPage({ params }) {
	try {
		const { data: detailData } = await fetchLibraryDetail(params.id);

		return <DetailClient detailData={detailData} />;
	} catch (error) {
		return <DetailClient detailData={[]} />;
	}
}
