import GuestbookClient from "./GuestbookClient";
import { fetchGuestbookList } from "@/queries/guestbook";

export default async function GuestbookPage() {
	try {
		const data = await fetchGuestbookList({ page: 1, limit: 10 });
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
