import SettingClient from "../SettingClient";

interface SettingPageProps {
	params: Promise<{
		setting: string;
	}>;
}

export default async function SettingDetailPage({
	params,
}: SettingPageProps) {
	const { setting } = await params;
	return <SettingClient initialSection={setting} />;
}
