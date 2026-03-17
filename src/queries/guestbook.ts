export {
	fetchGuestbookList,
	createGuestbookEntry,
	updateGuestbookEntry,
	deleteGuestbookEntry,
	verifyGuestbookSecret,
	uploadGuestbookImages,
} from "@/features/guestbook/api/client";
export type {
	GuestbookEntry,
	GuestbookListResponse,
	GuestbookListParams,
} from "@/features/guestbook/types";
