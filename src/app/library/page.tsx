export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { getDb } from "@/app/api/_lib/admin";
import {
	fetchLibraryListServer,
	fetchLibrarySeriesServer,
	fetchLibraryTagsServer,
} from "@/queries/fetch/fetchLibraryServer";
import LibraryClient, { type LibraryItem } from "./LibraryClient";

export default async function LibararyListPage({
	searchParams,
}: {
	searchParams?: Promise<{ page?: string }>;
}) {
	try {
		type LibraryListPayload = {
			items?: LibraryItem[];
			pinnedItems?: LibraryItem[];
			total?: number;
		};
		type LibraryListResponse = LibraryListPayload & { data?: LibraryListPayload };

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
				fetchLibraryListServer({
					page: currentPage,
					limit: postsPerPage,
				}) as Promise<LibraryListResponse>,
				fetchLibrarySeriesServer(),
				fetchLibraryTagsServer(),
			]);

		const finalListResponse = {
			items: listResponse?.data?.items ?? listResponse?.items ?? [],
			pinnedItems: listResponse?.data?.pinnedItems ?? listResponse?.pinnedItems ?? [],
			total: listResponse?.data?.total ?? listResponse?.total ?? 0,
		};
		const resolvedSeriesData: LibraryItem[] = Array.isArray(
			(seriesResponse as { data?: unknown })?.data
		)
			? ((seriesResponse as { data?: LibraryItem[] }).data ?? [])
			: Array.isArray(seriesResponse)
				? (seriesResponse as LibraryItem[])
				: [];

		return (
			<LibraryClient
				listData={finalListResponse.items}
				pinnedData={finalListResponse.pinnedItems}
				listTotal={finalListResponse.total}
				seriesData={resolvedSeriesData}
				tagData={
					Array.isArray((tagResponse as { data?: unknown })?.data)
						? ((tagResponse as { data?: unknown }).data as string[])
						: Array.isArray(tagResponse)
							? (tagResponse as string[])
							: []
				}
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
				initialIsCardOn={false}
			/>
		);
	}
}
