import { redirect } from "next/navigation";

export default async function SettingPage() {
	redirect("/setting/general");
}
