import {
	fetchLibraryDetailServer,
	fetchLibrarySeriesServer,
	fetchLibraryTagsServer,
} from "@/features/library/api/server";
import LibararyNewClient from "../../new/NewClient";

interface EditPageProps {
	params: Promise<{ id: string }>;
}

export default async function LibraryEditPage({ params }: EditPageProps) {
	const { id } = await params;
	try {
		const [{ data: detailData }, { data: tagsData }, { data: seriesData }] =
			await Promise.all([
				fetchLibraryDetailServer(id),
				fetchLibraryTagsServer(),
				fetchLibrarySeriesServer(),
			]);

		return (
			<LibararyNewClient
				mode="edit"
				initialData={detailData}
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
