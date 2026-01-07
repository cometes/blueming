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
				pinnedData={listResponse?.pinnedItems ?? []}
				listTotal={listResponse?.total ?? 0}
				seriesData={seriesData}
			/>
		);
	} catch {
		return (
			<LibraryClient listData={[]} pinnedData={[]} listTotal={0} seriesData={[]} />
		);
	}
}
