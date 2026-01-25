import { Suspense } from "react";
import {
	fetchLibraryListServer,
	fetchLibrarySeriesServer,
	fetchLibraryTagsServer,
} from "@/queries/fetch/fetchLibraryServer";
import { fetchSettingsServer } from "@/queries/fetch/fetchSettingsServer";
import LibraryClient from "./LibraryClient";

export default async function LibararyListPage({
	searchParams,
}: {
	searchParams?: Promise<{ page?: string }>;
}) {
	try {
		const params = searchParams ? await searchParams : undefined;
		let postsPerPage = 10;
		try {
			const { data: settingsData } = await fetchSettingsServer();
			if (typeof settingsData?.library?.postsPerPage === "number") {
				postsPerPage = settingsData.library.postsPerPage;
			}
		} catch {
		}

		const parsedPage = Number(params?.page);
		const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

		const [{ data: listResponse }, { data: seriesData }, { data: tagData }] =
			await Promise.all([
				fetchLibraryListServer({ page: currentPage, limit: postsPerPage }),
				fetchLibrarySeriesServer(),
				fetchLibraryTagsServer(),
			]);

		const finalListResponse = {
			items: listResponse?.items ?? [],
			pinnedItems: listResponse?.pinnedItems ?? [],
			total: listResponse?.total ?? 0,
		};

		return (
			<Suspense fallback={<div>Loading...</div>}>
				<LibraryClient
					listData={finalListResponse.items}
					pinnedData={finalListResponse.pinnedItems}
					listTotal={finalListResponse.total}
					seriesData={seriesData}
					tagData={Array.isArray(tagData) ? tagData : []}
					initialPage={currentPage}
				/>
			</Suspense>
		);
	} catch {
		return (
			<Suspense fallback={<div>Loading...</div>}>
				<LibraryClient
					listData={[]}
					pinnedData={[]}
					listTotal={0}
					seriesData={[]}
					tagData={[]}
					initialPage={1}
				/>
			</Suspense>
		);
	}
}
