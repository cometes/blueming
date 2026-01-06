import {
	fetchLibraryList,
	fetchLibrarySeries,
} from "@/queries/fetch/fetchLibrary";
import LibraryClient from "./LibraryClient";

export default async function LibararyListPage() {
	try {
		const { data: listResponse } = await fetchLibraryList();
		const { data: seriesData } = await fetchLibrarySeries();

		return (
			<LibraryClient
				listData={listResponse?.items ?? []}
				listTotal={listResponse?.total ?? 0}
				seriesData={seriesData}
			/>
		);
	} catch {
		return <LibraryClient listData={[]} listTotal={0} seriesData={[]} />;
	}
}
