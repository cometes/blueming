import ThreadClient from "./ThreadClient";
import { fetchThreadFeedDirect } from "@/features/thread/api/serverDirect";
import { getAuthContext } from "@/app/api/_lib/auth";

export default async function ThreadPage() {
	const authContext = await getAuthContext();
	const initialData = await fetchThreadFeedDirect(authContext);
	return <ThreadClient initialData={initialData} />;
}
