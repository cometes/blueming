import { fetchLibrarySeriesList } from "@/queries/fetch/fetchLibrary";
import SeriesClient from "./SeriesClient";

interface SeriesPageProps {
	params: Promise<{
		series: string;
	}>;
}

export default async function SeriesPage({ params }: SeriesPageProps) {
	const { series } = await params;

	try {
		const { data: seriesListData } = await fetchLibrarySeriesList(series);

		return <SeriesClient seriesListData={seriesListData} />;
	} catch {
		return <SeriesClient seriesListData={null} />;
	}
}
