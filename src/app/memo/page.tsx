import MemoClient from "./MemoClient";
import { fetchMemoListDirect } from "@/features/memo/api/serverDirect";

export default async function MemoPage() {
	try {
		const data = await fetchMemoListDirect();
		const initialMemos = data?.items ?? [];
		return <MemoClient initialMemos={initialMemos} />;
	} catch {
		return <MemoClient initialMemos={[]} />;
	}
}
