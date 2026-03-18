export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { getDb } from "@/app/api/_lib/admin";
import {
	fetchLibraryListDirect,
	fetchLibrarySeriesDirect,
	fetchLibraryTagsDirect,
} from "@/features/library/api/serverDirect";
import LibraryClient, { type LibraryItem } from "./LibraryClient";

export default async function LibraryListPage({
	searchParams,
}: {
	searchParams?: Promise<{
		page?: string;
		sort?: string;
		tag?: string;
		q?: string;
	}>;
}) {
	try {
		const cookieStore = await cookies();
		const cardCookie = cookieStore.get("library_card_on")?.value;
		const initialIsCardOn = cardCookie === "true";

		const params = searchParams ? await searchParams : undefined;
		const parsedPage = Number(params?.page);
		const currentPage =
			Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
		const sort = (params?.sort as "latest" | "oldest" | "title") ?? "latest";
		const tag = params?.tag ?? "";
		const query = params?.q ?? "";

		const db = getDb();
		const settingsPromise = db
			.collection("settings")
			.doc("library")
			.get()
			.catch(() => null);

		const [settingsSnap, seriesData, tagData] = await Promise.all([
			settingsPromise,
			fetchLibrarySeriesDirect(),
			fetchLibraryTagsDirect(),
		]);

		const postsPerPage =
			typeof settingsSnap?.data()?.postsPerPage === "number"
				? (settingsSnap.data()!.postsPerPage as number)
				: 10;

		const listResult = await fetchLibraryListDirect({
			page: currentPage,
			limit: postsPerPage,
			sort,
			tag,
			query,
		});

		return (
			<LibraryClient
				listData={listResult.items as LibraryItem[]}
				pinnedData={listResult.pinnedItems as LibraryItem[]}
				listTotal={listResult.total}
				seriesData={seriesData as unknown as LibraryItem[]}
				tagData={tagData}
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
