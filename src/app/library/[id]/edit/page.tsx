import { fetchLibraryDetail, fetchLibrarySeries, fetchLibraryTags } from "@/queries/fetch/fetchLibrary";
import LibararyNewClient from "../../new/NewClient";

interface EditPageProps {
	params: { id: string };
}

export default async function LibraryEditPage({ params }: EditPageProps) {
	try {
		const [{ data: detailData }, { data: tagsData }, { data: seriesData }] =
			await Promise.all([
				fetchLibraryDetail(params.id),
				fetchLibraryTags(),
				fetchLibrarySeries(),
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
