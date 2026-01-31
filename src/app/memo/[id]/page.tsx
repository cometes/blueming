import MemoDetailClient from "./MemoDetailClient";
import { fetchMemoDetailServer } from "@/queries/memo";

interface MemoDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function MemoDetailPage({ params }: MemoDetailPageProps) {
	const { id } = await params;
	const initialMemo = await fetchMemoDetailServer(id);
	return <MemoDetailClient memoId={id} initialMemo={initialMemo ?? undefined} />;
}
