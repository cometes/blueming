import {
	fetchLibrarySeriesServer,
	fetchLibraryTagsServer,
} from "@/features/library/api/server";
import LibararyNewClient from "./NewClient";

export default async function LibararyNewPage() {
	try {
		const { data: tagsData } = await fetchLibraryTagsServer();
		const { data: seriesData } = await fetchLibrarySeriesServer();

		return <LibararyNewClient seriesData={seriesData} tagsData={tagsData} />;
	} catch {
		return <LibararyNewClient seriesData={[]} tagsData={[]} />;
	}
}
