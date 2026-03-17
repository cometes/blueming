export const dynamic = "force-dynamic";

import GuestbookClient from "./GuestbookClient";
import { fetchGuestbookListServer } from "@/features/guestbook/api/server";

export default async function GuestbookPage() {
	try {
		const data = await fetchGuestbookListServer({ page: 1, limit: 10 });
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
