export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { getDb } from "@/app/api/_lib/admin";
import {
	fetchLibraryListServer,
	fetchLibrarySeriesServer,
	fetchLibraryTagsServer,
} from "@/queries/fetch/fetchLibraryServer";
import LibraryClient from "./LibraryClient";

export default async function LibararyListPage({
	searchParams,
}: {
	searchParams?: Promise<{ page?: string }>;
}) {
	try {
		const cookieStore = await cookies();
		const cardCookie = cookieStore.get("library_card_on")?.value;
		const initialIsCardOn = cardCookie === "true";

		const params = searchParams ? await searchParams : undefined;
		const parsedPage = Number(params?.page);
		const currentPage =
			Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

		let postsPerPage = 10;
		try {
			const db = getDb();
			const settingsSnap = await db.collection("settings").doc("library").get();
			const settingsData = settingsSnap.exists ? settingsSnap.data() || {} : {};
			if (typeof settingsData.postsPerPage === "number") {
				postsPerPage = settingsData.postsPerPage;
			}
		} catch {
		}

		const [listResponse, seriesResponse, tagResponse] =
			await Promise.all([
				fetchLibraryListServer({ page: currentPage, limit: postsPerPage }),
				fetchLibrarySeriesServer(),
				fetchLibraryTagsServer(),
			]);

		const finalListResponse = {
			items: listResponse?.data?.items ?? listResponse?.items ?? [],
			pinnedItems: listResponse?.data?.pinnedItems ?? listResponse?.pinnedItems ?? [],
			total: listResponse?.data?.total ?? listResponse?.total ?? 0,
		};

		return (
			<LibraryClient
				listData={finalListResponse.items}
				pinnedData={finalListResponse.pinnedItems}
				listTotal={finalListResponse.total}
				seriesData={
					(seriesResponse as { data?: unknown })?.data ??
					(seriesResponse as unknown[])
				}
				tagData={
					Array.isArray((tagResponse as { data?: unknown })?.data)
						? ((tagResponse as { data?: unknown }).data as string[])
						: Array.isArray(tagResponse)
							? (tagResponse as string[])
							: []
				}
				initialPage={currentPage}
				initialIsCardOn={initialIsCardOn}
			/>
		);
	} catch {
		return (
			<LibraryClient
				listData={[]}
				pinnedData={[]}
				listTotal={0}
				seriesData={[]}
				tagData={[]}
				initialPage={1}
				initialIsCardOn={false}
			/>
		);
	}
}
