import { Suspense } from "react";
import { apiClient } from "@/queries/apiClient";
import {
	fetchLibraryList,
	fetchLibrarySeries,
	fetchLibraryTags,
} from "@/queries/fetch/fetchLibrary";
import LibraryClient from "./LibraryClient";

export default async function LibararyListPage({
	searchParams,
}: {
	searchParams?: Promise<{ page?: string }>;
}) {
	try {
		const params = searchParams ? await searchParams : undefined;
		const parsedPage = Number(params?.page);
		const currentPage =
			Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

		let postsPerPage = 10;
		try {
			const settingsResponse = await apiClient.get("/settings");
			const settingsData = settingsResponse.data;
			if (typeof settingsData?.library?.postsPerPage === "number") {
				postsPerPage = settingsData.library.postsPerPage;
			}
		} catch {
		}

		const [{ data: listResponse }, { data: seriesData }, { data: tagData }] =
			await Promise.all([
				fetchLibraryList({ page: currentPage, limit: postsPerPage }),
				fetchLibrarySeries(),
				fetchLibraryTags(),
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
