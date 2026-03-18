import { fetchLibrarySeriesListDirect } from "@/features/library/api/serverDirect";
import SeriesClient from "./SeriesClient";

interface SeriesPageProps {
	params: Promise<{
		series: string;
	}>;
}

export default async function SeriesPage({ params }: SeriesPageProps) {
	const { series } = await params;

	try {
		const raw = await fetchLibrarySeriesListDirect(series);
		const seriesListData = {
			series: raw.series,
			lastUpdatedThumbnail: raw.lastUpdatedThumbnail,
			lastUpdatedDate: raw.lastUpdatedDate,
			data: raw.data
				.filter((p) => p.id && p.title && p.createdAt)
				.map((p) => ({
					id: p.id as string,
					title: p.title as string,
					subtitle: p.subtitle,
					slug: p.slug ?? undefined,
					createdAt: p.createdAt as string,
					thumbnail: p.thumbnail,
				})),
		};
		return <SeriesClient seriesListData={seriesListData} />;
	} catch {
		return <SeriesClient seriesListData={null} />;
	}
}
