export const dynamic = "force-dynamic";

import GuestbookClient from "./GuestbookClient";
import { fetchGuestbookListDirect } from "@/features/guestbook/api/serverDirect";
import { getAuthContext } from "@/app/api/_lib/auth";

export default async function GuestbookPage() {
	try {
		const authContext = await getAuthContext();
		const data = await fetchGuestbookListDirect({ page: 1, limit: 10 }, authContext);
		return (
			<GuestbookClient
				initialEntries={data.items}
				total={data.total}
				pageSize={data.limit}
			/>
		);
	} catch {
		return <GuestbookClient initialEntries={[]} total={0} pageSize={10} />;
	}
}
