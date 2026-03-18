export const revalidateSettingsCache = async (): Promise<void> => {
	try {
		await fetch("/api/revalidate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ tag: "settings" }),
		});
	} catch {
	}
};
