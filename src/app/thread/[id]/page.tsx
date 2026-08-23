import ThreadDetailClient from "./ThreadDetailClient";
import { fetchThreadDetailDirect } from "@/features/thread/api/serverDirect";
import { getAuthContext } from "@/app/api/_lib/auth";

export default async function ThreadDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const authContext = await getAuthContext();
	const initialData = await fetchThreadDetailDirect(id, authContext);
	return <ThreadDetailClient threadId={id} initialData={initialData} />;
}
