export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import {
	fetchLibraryListDirect,
	fetchLibrarySettingsCached,
	fetchLibrarySeriesCached,
	fetchLibraryTagsCached,
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

		// settings/series/tags는 unstable_cache로 캐싱 → cache hit 시 거의 즉시 완료
		// list는 settings 완료 즉시 체이닝되어 바로 시작
		const settingsPromise = fetchLibrarySettingsCached();
		const seriesPromise = fetchLibrarySeriesCached();
		const tagsPromise = fetchLibraryTagsCached();
		const listPromise = settingsPromise.then((settings) => {
			const postsPerPage =
				typeof settings.postsPerPage === "number" ? settings.postsPerPage : 10;
			return fetchLibraryListDirect({
				page: currentPage,
				limit: postsPerPage,
				sort,
				tag,
				query,
			});
		});

		const [seriesData, tagData, listResult] = await Promise.all([
			seriesPromise,
			tagsPromise,
			listPromise,
		]);

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
