import type { BaseCommentEntry } from "@/shared/types/comment";
import type { PaginatedResponse, PaginatedParams } from "@/shared/types/api";

export type GuestbookEntry = BaseCommentEntry;

export type GuestbookListResponse = PaginatedResponse<GuestbookEntry>;

export type GuestbookListParams = PaginatedParams;
