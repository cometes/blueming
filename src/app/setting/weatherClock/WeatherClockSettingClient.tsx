"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { setSettingsMainWeatherClock } from "@/queries/set/setSettingsMainWeatherClock";

export default function WeatherClockSettingClient() {
	const settings = useSettings();
	const refreshSettings = settings.refreshSettings;
	const updateMain = settings.updateMain;

	const [enabled, setEnabled] = useState(true);
	const [city, setCity] = useState("Seoul");
	const [isSyncing, setIsSyncing] = useState(true);

	const isDirty = useMemo(() => {
		if (isSyncing) return false;
		const baseline = settings.main?.weatherClock || { enabled: true, city: "Seoul" };
		return enabled !== baseline.enabled || city !== baseline.city;
	}, [enabled, city, settings.main?.weatherClock, isSyncing]);

	useSettingStatus("weatherClock", isDirty ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-weatherClock"
			variant="ghost"
			size="icon"
			disabled={!isDirty}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{
				transition: "all 0.3s ease-in-out",
			}}
		>
			<Save size={16} />
		</Button>,
		[isDirty]
	);

	// Load from settings
	useEffect(() => {
		setIsSyncing(true);
		const weatherClock = settings.main?.weatherClock;
		if (weatherClock) {
			setEnabled(weatherClock.enabled);
			setCity(weatherClock.city);
		}
		setIsSyncing(false);
	}, [settings.main?.weatherClock]);

	const handleSave = useCallback(async () => {
		try {
			if (!city.trim()) {
				toast.error("도시명을 입력해주세요.");
				return;
			}

			const weatherClockSettings = {
				enabled,
				city: city.trim(),
			};

			await setSettingsMainWeatherClock(weatherClockSettings);
			await refreshSettings?.({ broadcast: true });
			updateMain?.({ weatherClock: weatherClockSettings });
			toast.success("저장되었습니다.");
		} catch (error) {
			console.error("Failed to save weather clock settings:", error);
			toast.error("저장에 실패했습니다.");
		}
	}, [enabled, city, refreshSettings, updateMain]);

	const handleReset = useCallback(() => {
		const weatherClock = settings.main?.weatherClock;
		if (weatherClock) {
			setEnabled(weatherClock.enabled);
			setCity(weatherClock.city);
		} else {
			setEnabled(true);
			setCity("Seoul");
		}
		toast.info("변경사항이 취소되었습니다.");
	}, [settings.main?.weatherClock]);

	return (
		<form
			id="setting-form-weatherClock"
			onSubmit={(e) => {
				e.preventDefault();
				handleSave();
			}}
			className="space-y-6"
		>
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label htmlFor="enabled">위젯 활성화</Label>
					<p className="text-sm text-sub-text">
						날씨&시계 위젯을 메인 페이지에 표시합니다.
					</p>
				</div>
				<Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
			</div>

			<Separator />

			<div className="space-y-2">
				<Label htmlFor="city">도시명</Label>
				<Input
					id="city"
					type="text"
					placeholder="예: Seoul, Busan, Tokyo"
					value={city}
					onChange={(e) => setCity(e.target.value)}
					disabled={!enabled}
				/>
				<p className="text-sm text-sub-text">
					날씨 정보를 표시할 도시를 영문으로 입력해주세요. (예: Seoul, Busan, Tokyo, New
					York)
				</p>
			</div>

			<Separator />

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={handleReset} disabled={!isDirty}>
					취소
				</Button>
				{/* 저장 버튼은 헤더로 이동 */}
			</div>
		</form>
	);
}
