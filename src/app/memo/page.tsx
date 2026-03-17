export const dynamic = "force-dynamic";

import MemoClient from "./MemoClient";
import { fetchMemoListServer } from "@/features/memo/api/server";

export default async function MemoPage() {
	try {
		const data = await fetchMemoListServer();
		const initialMemos = data?.items ?? [];
		return <MemoClient initialMemos={initialMemos} />;
	} catch {
		return <MemoClient initialMemos={[]} />;
	}
}
