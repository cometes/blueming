import {
	fetchLibrarySeriesDirect,
	fetchLibraryTagsDirect,
} from "@/features/library/api/serverDirect";
import LibararyNewClient from "./NewClient";

export default async function LibararyNewPage() {
	try {
		const [rawTags, rawSeries] = await Promise.all([
			fetchLibraryTagsDirect(),
			fetchLibrarySeriesDirect(),
		]);

		const tagsData = rawTags.map((t) => ({ id: t, name: t }));
		const seriesData = rawSeries.map((s) => ({ id: s.series, name: s.series }));

		return <LibararyNewClient seriesData={seriesData} tagsData={tagsData} />;
	} catch {
		return <LibararyNewClient seriesData={[]} tagsData={[]} />;
	}
}
