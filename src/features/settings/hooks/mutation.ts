import type { SettingsRefreshOptions } from "@/features/settings/types";

interface RunSettingsMutationArgs<TResponse> {
	execute: () => Promise<TResponse>;
	onSuccess?: (response: TResponse) => void | Promise<void>;
	refreshSettings?: (options?: SettingsRefreshOptions) => Promise<void>;
	channelName?: string;
	broadcastPayload?: (response: TResponse) => Record<string, unknown>;
}

export const runSettingsMutation = async <TResponse>({
	execute,
	onSuccess,
	refreshSettings,
	channelName,
	broadcastPayload,
}: RunSettingsMutationArgs<TResponse>) => {
	const response = await execute();

	if (onSuccess) {
		await onSuccess(response);
	}

	await refreshSettings?.({ broadcast: true });

	if (channelName) {
		const channel = new BroadcastChannel(channelName);
		channel.postMessage({
			...(broadcastPayload ? broadcastPayload(response) : {}),
			timestamp: Date.now(),
		});
		channel.close();
	}

	return response;
};

