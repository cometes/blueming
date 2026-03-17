import { cache } from "react";
import { API_BASE } from "@/shared/lib/http/client";

const defaultRevalidateSeconds = 60;

export const fetchSettingsServer = cache(async () => {
	const response = await fetch(`${API_BASE}/settings`, {
		next: { revalidate: defaultRevalidateSeconds, tags: ["settings"] },
	});
	if (!response.ok) {
		throw new Error("Failed to fetch settings");
	}
	const data = await response.json();
	return { data };
});
