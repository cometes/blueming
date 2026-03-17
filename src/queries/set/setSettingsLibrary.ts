export { setSettingsLibrary } from "@/features/settings/api/client";
export type { SetSettingsLibraryResponse } from "@/features/settings/api/client";
import type { LibrarySettings } from "@/features/settings/types";

export type SetSettingsLibraryPayload = Partial<LibrarySettings>;
