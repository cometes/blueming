"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import {
	fetchGeminiApiKeyStatus,
	fetchWeatherApiKeyStatus,
	saveGeminiApiKey,
	saveWeatherApiKey,
} from "@/features/account/api/client";
import { toast } from "sonner";

export default function AccountSettingClient() {
	const [geminiApiKey, setGeminiApiKey] = useState("");
	const [keyHint, setKeyHint] = useState<string | null>(null);
	const [weatherApiKey, setWeatherApiKey] = useState("");
	const [weatherKeyHint, setWeatherKeyHint] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const isDirty = useMemo(
		() => geminiApiKey.trim().length > 0 || weatherApiKey.trim().length > 0,
		[geminiApiKey, weatherApiKey]
	);

	useSettingStatus("account", isDirty ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-account"
			variant="ghost"
			size="icon"
			disabled={!isDirty || isSaving}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{ transition: "all 0.3s ease-in-out" }}
		>
			<Save size={16} />
		</Button>,
		[isDirty, isSaving]
	);

	useEffect(() => {
		let mounted = true;
		const fetchStatus = async () => {
			try {
				setIsLoading(true);
				const [geminiStatus, weatherStatus] = await Promise.all([
					fetchGeminiApiKeyStatus(),
					fetchWeatherApiKeyStatus(),
				]);
				if (!mounted) return;
				setKeyHint(geminiStatus.keyHint ?? null);
				setWeatherKeyHint(weatherStatus.keyHint ?? null);
			} catch (error) {
				if (!mounted) return;
				setKeyHint(null);
				setWeatherKeyHint(null);
				toast.error(
					error instanceof Error
						? error.message
						: "API 키 정보를 불러오지 못했습니다."
				);
			} finally {
				if (mounted) setIsLoading(false);
			}
		};
		void fetchStatus();
		return () => {
			mounted = false;
		};
	}, []);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		try {
			setIsSaving(true);
			const geminiNextKey = geminiApiKey.trim();
			const weatherNextKey = weatherApiKey.trim();

			if (!geminiNextKey && !weatherNextKey) {
				return;
			}

			const [geminiResult, weatherResult] = await Promise.all([
				geminiNextKey ? saveGeminiApiKey(geminiNextKey) : Promise.resolve(null),
				weatherNextKey
					? saveWeatherApiKey(weatherNextKey)
					: Promise.resolve(null),
			]);

			if (geminiResult) {
				setKeyHint(geminiResult?.keyHint ?? null);
				setGeminiApiKey("");
			}
			if (weatherResult) {
				setWeatherKeyHint(weatherResult?.keyHint ?? null);
				setWeatherApiKey("");
			}
			toast.success("API 키가 저장되었습니다.");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "API 키 저장에 실패했습니다."
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<form
			id="setting-form-account"
			onSubmit={handleSubmit}
			className="space-y-8"
		>
			<section>
				<h2 className="text-[20px] font-semibold font-title">API 키 관리</h2>
				<div className="section-wrap mt-6">
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">Gemini API Key</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								AI 컨텐츠 생성에 사용합니다.
							</p>
						</div>
						<div className="flex flex-col gap-2 w-full max-w-md">
							<Input
								type="password"
								value={geminiApiKey}
								onChange={(event) => setGeminiApiKey(event.target.value)}
								placeholder={
									isLoading
										? "불러오는 중..."
										: keyHint
										? "저장된 키가 있습니다."
										: "Gemini API Key"
								}
								className="rounded-card border-card bg-card-bg"
								disabled={isLoading || isSaving}
							/>
							{keyHint ? (
								<p className="text-xs text-sub-text">
									현재 저장된 키: {keyHint}
								</p>
							) : null}
						</div>
					</div>
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">
								OpenWeather API Key
							</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								날씨 위젯에 사용합니다.
							</p>
						</div>
						<div className="flex flex-col gap-2 w-full max-w-md">
							<Input
								type="password"
								value={weatherApiKey}
								onChange={(event) => setWeatherApiKey(event.target.value)}
								placeholder={
									isLoading
										? "불러오는 중..."
										: weatherKeyHint
										? "저장된 키가 있습니다."
										: "OpenWeather API Key"
								}
								className="rounded-card border-card bg-card-bg"
								disabled={isLoading || isSaving}
							/>
							{weatherKeyHint ? (
								<p className="text-xs text-sub-text">
									현재 저장된 키: {weatherKeyHint}
								</p>
							) : null}
						</div>
					</div>
				</div>
			</section>
		</form>
	);
}
