import {
	fetchLibraryList,
	fetchLibrarySeries,
} from "@/queries/fetch/fetchLibrary";
import LibraryClient from "./LibraryClient";

export default async function LibararyListPage() {
	try {
		const { data: listData } = await fetchLibraryList();
		const { data: seriesData } = await fetchLibrarySeries();

		return <LibraryClient listData={listData} seriesData={seriesData} />;
	} catch (error) {
		return <LibraryClient listData={[]} seriesData={[]} />;
	}
}
