import {
	fetchLibrarySeries,
	fetchLibraryTags,
} from "@/queries/fetch/fetchLibrary";
import LibararyNewClient from "./NewClient";

export default async function LibararyNewPage() {
	try {
		const { data: tagsData } = await fetchLibraryTags();
		const { data: seriesData } = await fetchLibrarySeries();

		return <LibararyNewClient seriesData={seriesData} tagsData={tagsData} />;
	} catch {
		return <LibararyNewClient seriesData={[]} tagsData={[]} />;
	}
}
