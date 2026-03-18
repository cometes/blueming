import MemoDetailClient from "./MemoDetailClient";
import { fetchMemoDetailDirect } from "@/features/memo/api/serverDirect";
import { getAuthContext } from "@/app/api/_lib/auth";

interface MemoDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function MemoDetailPage({ params }: MemoDetailPageProps) {
	const { id } = await params;
	const authContext = await getAuthContext();
	const initialMemo = await fetchMemoDetailDirect(id, authContext);
	return <MemoDetailClient memoId={id} initialMemo={initialMemo ?? undefined} />;
}
