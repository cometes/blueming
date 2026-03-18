import {
	fetchLibraryDetailDirect,
	fetchLibrarySeriesDirect,
	fetchLibraryTagsDirect,
} from "@/features/library/api/serverDirect";
import LibararyNewClient from "../../new/NewClient";

interface EditPageProps {
	params: Promise<{ id: string }>;
}

export default async function LibraryEditPage({ params }: EditPageProps) {
	const { id } = await params;
	try {
		const [detailData, rawTags, rawSeries] = await Promise.all([
			fetchLibraryDetailDirect(id),
			fetchLibraryTagsDirect(),
			fetchLibrarySeriesDirect(),
		]);

		const tagsData = rawTags.map((t) => ({ id: t, name: t }));
		const seriesData = rawSeries.map((s) => ({ id: s.series, name: s.series }));

		return (
			<LibararyNewClient
				mode="edit"
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				initialData={detailData ? ({ ...detailData, content: detailData.content ?? "" } as any) : undefined}
				tagsData={tagsData}
				seriesData={seriesData}
			/>
		);
	} catch {
		return (
			<LibararyNewClient
				mode="edit"
				initialData={undefined}
				tagsData={[]}
				seriesData={[]}
			/>
		);
	}
}
